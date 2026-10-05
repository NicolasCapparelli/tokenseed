import type { GeneratedSystem } from "./engine";
import { resolvedTree } from "./export/dtcg";
import type { KnobValue } from "./knobs/types";
import { createSeed, migrateSeed, type Seed } from "./seed";
import { flatten, type ModeName } from "./tokens";

/**
 * Design systems work like git repositories: a repo holds snapshots (commits) of seeds, branches
 * for experiments, tags for releases, and a working seed being edited. Forks copy the whole
 * history and remember where they came from. Every operation is pure and returns a new repo.
 */

export interface Snapshot {
  /** Content hash of parent, seed, message and time. */
  id: string;
  parent: string | null;
  seed: Seed;
  message: string;
  createdAt: string;
  /** Engine version the seed was generated with. */
  engine: string;
}

export interface Tag {
  snapshot: string;
  message?: string;
  createdAt: string;
}

export type Head = { branch: string } | { detached: string };

export interface Repo {
  format: "tokenseed-repo";
  version: 1;
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  forkedFrom?: { repo: string; name: string; snapshot: string };
  snapshots: Record<string, Snapshot>;
  branches: Record<string, string>;
  tags: Record<string, Tag>;
  head: Head;
  /** The seed being edited. Differs from the head snapshot when there are uncommitted changes. */
  working: Seed;
}

export interface RepoOptions {
  /** ISO timestamp; defaults to now. Pass one for reproducible results. */
  now?: string;
  id?: string;
}

export const DEFAULT_BRANCH = "main";
const NAME = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$/;

const nowIso = (o: RepoOptions) => o.now ?? new Date().toISOString();
const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

/** JSON with sorted keys, so equal values always serialize the same way. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined).sort(([a], [b]) => (a < b ? -1 : 1));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** cyrb53: a fast 53-bit string hash. Enough to name snapshots; not a security boundary. */
export function hash(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
}

export const sameSeed = (a: Seed, b: Seed) => canonical(a) === canonical(b);

function makeSnapshot(parent: string | null, seed: Seed, message: string, createdAt: string): Snapshot {
  const id = hash(canonical({ parent, seed, message, createdAt }));
  return { id, parent, seed: structuredClone(seed), message, createdAt, engine: seed.engine };
}

export function createRepo(name: string, seed: Seed = createSeed({ "identity.name": name }), o: RepoOptions = {}): Repo {
  const at = nowIso(o);
  const first = makeSnapshot(null, seed, "Create system", at);
  return {
    format: "tokenseed-repo", version: 1, id: o.id ?? newId(), name, createdAt: at, updatedAt: at,
    snapshots: { [first.id]: first }, branches: { [DEFAULT_BRANCH]: first.id }, tags: {},
    head: { branch: DEFAULT_BRANCH }, working: structuredClone(seed),
  };
}

/** The snapshot the head points at. */
export function headSnapshot(repo: Repo): Snapshot {
  const id = "branch" in repo.head ? repo.branches[repo.head.branch] : repo.head.detached;
  const snap = id && repo.snapshots[id];
  if (!snap) throw new Error("Repository head points at a missing snapshot");
  return snap;
}

export const currentBranch = (repo: Repo) => ("branch" in repo.head ? repo.head.branch : null);
export const isDirty = (repo: Repo) => !sameSeed(repo.working, headSnapshot(repo).seed);

/** Resolves a branch name, tag name or (possibly shortened) snapshot id to a snapshot id. */
export function resolveRef(repo: Repo, ref: string): string {
  if (repo.branches[ref]) return repo.branches[ref]!;
  if (repo.tags[ref]) return repo.tags[ref]!.snapshot;
  if (repo.snapshots[ref]) return ref;
  const matches = Object.keys(repo.snapshots).filter((id) => ref.length >= 4 && id.startsWith(ref));
  if (matches.length === 1) return matches[0]!;
  throw new Error(matches.length ? `"${ref}" is ambiguous` : `Unknown branch, tag or snapshot "${ref}"`);
}

/** Replaces the working seed. This is the only way edits enter a repo. */
export function edit(repo: Repo, seed: Seed): Repo {
  return { ...repo, working: seed };
}

/** Records the working seed as a new snapshot on the current branch (or detached head). */
export function commit(repo: Repo, message: string, o: RepoOptions = {}): Repo {
  const parent = headSnapshot(repo);
  if (sameSeed(repo.working, parent.seed)) throw new Error("Nothing to commit");
  const at = nowIso(o);
  const snap = makeSnapshot(parent.id, repo.working, message.trim() || "Update system", at);
  const snapshots = { ...repo.snapshots, [snap.id]: snap };
  if ("branch" in repo.head) {
    return { ...repo, snapshots, branches: { ...repo.branches, [repo.head.branch]: snap.id }, updatedAt: at };
  }
  return { ...repo, snapshots, head: { detached: snap.id }, updatedAt: at };
}

/** Moves the head to a branch, tag or snapshot, loading its seed. Refuses to drop uncommitted changes unless forced. */
export function checkout(repo: Repo, ref: string, opts: { force?: boolean } = {}): Repo {
  if (!opts.force && isDirty(repo)) throw new Error("You have uncommitted changes. Save a snapshot or discard them first.");
  const head: Head = repo.branches[ref] ? { branch: ref } : { detached: resolveRef(repo, ref) };
  const target = "branch" in head ? repo.branches[head.branch]! : head.detached;
  return { ...repo, head, working: structuredClone(repo.snapshots[target]!.seed) };
}

/** Throws away uncommitted changes. */
export const discard = (repo: Repo): Repo => ({ ...repo, working: structuredClone(headSnapshot(repo).seed) });

/** Creates a branch at a ref (default: the head) and, unless told otherwise, switches to it, keeping working changes. */
export function branch(repo: Repo, name: string, opts: { from?: string; switchTo?: boolean } = {}): Repo {
  if (!NAME.test(name)) throw new Error(`"${name}" is not a valid branch name`);
  if (repo.branches[name]) throw new Error(`Branch "${name}" already exists`);
  const at = opts.from ? resolveRef(repo, opts.from) : headSnapshot(repo).id;
  const next = { ...repo, branches: { ...repo.branches, [name]: at } };
  if (opts.switchTo === false) return next;
  return opts.from ? checkout(next, name, { force: true }) : { ...next, head: { branch: name } };
}

export function deleteBranch(repo: Repo, name: string): Repo {
  if (!repo.branches[name]) throw new Error(`Unknown branch "${name}"`);
  if (currentBranch(repo) === name) throw new Error("Can't delete the branch you're on");
  const { [name]: _, ...branches } = repo.branches;
  return { ...repo, branches };
}

export function renameBranch(repo: Repo, from: string, to: string): Repo {
  if (!repo.branches[from]) throw new Error(`Unknown branch "${from}"`);
  if (!NAME.test(to) || repo.branches[to]) throw new Error(`Can't rename to "${to}"`);
  const branches = Object.fromEntries(Object.entries(repo.branches).map(([k, v]) => [k === from ? to : k, v]));
  const head = currentBranch(repo) === from ? { branch: to } : repo.head;
  return { ...repo, branches, head };
}

/** Marks a snapshot as a release, e.g. "v1.0". Tags never move. */
export function tag(repo: Repo, name: string, opts: { ref?: string; message?: string } & RepoOptions = {}): Repo {
  if (!NAME.test(name)) throw new Error(`"${name}" is not a valid tag name`);
  if (repo.tags[name]) throw new Error(`Tag "${name}" already exists`);
  const snapshot = opts.ref ? resolveRef(repo, opts.ref) : headSnapshot(repo).id;
  const t: Tag = { snapshot, createdAt: nowIso(opts), ...(opts.message ? { message: opts.message } : {}) };
  return { ...repo, tags: { ...repo.tags, [name]: t } };
}

export function deleteTag(repo: Repo, name: string): Repo {
  const { [name]: _, ...tags } = repo.tags;
  return { ...repo, tags };
}

/** History from a ref back to the first snapshot, newest first. */
export function log(repo: Repo, ref?: string): Snapshot[] {
  const out: Snapshot[] = [];
  let id: string | null = ref ? resolveRef(repo, ref) : headSnapshot(repo).id;
  while (id) {
    const s: Snapshot | undefined = repo.snapshots[id];
    if (!s) break;
    out.push(s);
    id = s.parent;
  }
  return out;
}

/** Branch and tag names pointing at each snapshot, for drawing history. */
export function refsBySnapshot(repo: Repo): Record<string, { branches: string[]; tags: string[] }> {
  const out: Record<string, { branches: string[]; tags: string[] }> = {};
  const at = (id: string) => (out[id] ??= { branches: [], tags: [] });
  for (const [name, id] of Object.entries(repo.branches)) at(id).branches.push(name);
  for (const [name, t] of Object.entries(repo.tags)) at(t.snapshot).tags.push(name);
  return out;
}

/** Brings an old snapshot's seed back as uncommitted changes on the current head, like git revert to a point. */
export function restore(repo: Repo, ref: string): Repo {
  const id = resolveRef(repo, ref);
  return { ...repo, working: structuredClone(repo.snapshots[id]!.seed) };
}

/**
 * Copies the repository, history included, under a new id. The fork remembers where it came from;
 * nothing that happens in the fork changes the original.
 */
export function fork(repo: Repo, opts: { name?: string } & RepoOptions = {}): Repo {
  const at = nowIso(opts);
  const name = opts.name ?? `${repo.name} (fork)`;
  const head = headSnapshot(repo);
  const copy: Repo = {
    ...structuredClone(repo),
    id: opts.id ?? newId(),
    name,
    createdAt: at,
    updatedAt: at,
    forkedFrom: { repo: repo.id, name: repo.name, snapshot: head.id },
    working: { ...structuredClone(head.seed), knobs: { ...head.seed.knobs, "identity.name": name } },
  };
  // The rename is the fork's first snapshot, so a fresh fork has no unsaved changes.
  const forked = sameSeed(copy.working, head.seed) ? copy : commit(copy, `Fork of ${repo.name}`, { now: at });
  // Uncommitted work in the original comes along as uncommitted work in the fork.
  if (!isDirty(repo)) return forked;
  return { ...forked, working: { ...structuredClone(repo.working), knobs: { ...repo.working.knobs, "identity.name": name } } };
}

// ── Diffs ────────────────────────────────────────────────────────────────────

export interface SeedChange {
  kind: "knob" | "trait" | "preset" | "lock" | "engine" | "random";
  id: string;
  from?: KnobValue | number | boolean;
  to?: KnobValue | number | boolean;
}

/** What a user changed between two seeds, input by input. */
export function diffSeeds(a: Seed, b: Seed): SeedChange[] {
  const out: SeedChange[] = [];
  const cmp = <T>(kind: SeedChange["kind"], x: Record<string, T>, y: Record<string, T>) => {
    for (const id of [...new Set([...Object.keys(x), ...Object.keys(y)])].sort()) {
      if (canonical(x[id]) === canonical(y[id])) continue;
      const change: SeedChange = { kind, id };
      if (id in x) change.from = x[id] as SeedChange["from"];
      if (id in y) change.to = y[id] as SeedChange["to"];
      out.push(change);
    }
  };
  if (a.engine !== b.engine) out.push({ kind: "engine", id: "engine", from: a.engine, to: b.engine });
  cmp("preset", Object.fromEntries(a.presets.map((p, i) => [p, i])), Object.fromEntries(b.presets.map((p, i) => [p, i])));
  cmp("trait", a.traits, b.traits);
  cmp("knob", migrateSeed(a).knobs, migrateSeed(b).knobs);
  cmp("lock", Object.fromEntries(a.locks.map((l) => [l, true])), Object.fromEntries(b.locks.map((l) => [l, true])));
  if (a.random !== b.random) out.push({ kind: "random", id: "random", from: a.random, to: b.random });
  return out;
}

export interface TokenChange {
  path: string;
  mode: ModeName | "base";
  kind: "added" | "removed" | "changed";
  from?: unknown;
  to?: unknown;
}

/** What changed in the output, comparing fully resolved token values mode by mode. */
export function diffTokens(a: GeneratedSystem, b: GeneratedSystem): TokenChange[] {
  const out: TokenChange[] = [];
  const modes = [...new Set([...a.modes, ...b.modes])];
  const values = (s: GeneratedSystem, mode: ModeName) =>
    s.modes.includes(mode) ? new Map(flatten(resolvedTree(s, mode)).map(([p, t]) => [p, t.$value])) : new Map<string, unknown>();
  const seen = new Map<string, string>();
  for (const mode of modes) {
    const x = values(a, mode);
    const y = values(b, mode);
    for (const path of [...new Set([...x.keys(), ...y.keys()])].sort()) {
      const from = x.get(path);
      const to = y.get(path);
      const kind = from === undefined ? "added" : to === undefined ? "removed" : canonical(from) === canonical(to) ? null : "changed";
      if (!kind) continue;
      out.push({ path, mode, kind, ...(from !== undefined ? { from } : {}), ...(to !== undefined ? { to } : {}) });
      seen.set(`${mode}:${path}`, canonical([from, to]));
    }
  }
  // Collapse changes identical in every mode into a single "base" entry.
  const byPath = new Map<string, TokenChange[]>();
  for (const c of out) byPath.set(c.path, [...(byPath.get(c.path) ?? []), c]);
  const collapsed: TokenChange[] = [];
  for (const [path, changes] of byPath) {
    const same = changes.length === modes.length && new Set(changes.map((c) => seen.get(`${c.mode}:${path}`))).size === 1;
    collapsed.push(...(same ? [{ ...changes[0]!, mode: "base" as const }] : changes));
  }
  return collapsed;
}

// ── Bundles ──────────────────────────────────────────────────────────────────

/** A portable .tokenseed file: the whole repository as JSON. */
export function exportBundle(repo: Repo): string {
  return JSON.stringify(repo, null, 2) + "\n";
}

/** Reads a .tokenseed file. Checks structure so a bad file fails loudly instead of corrupting a library. */
export function importBundle(text: string, opts: { newId?: boolean } = {}): Repo {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid JSON");
  }
  const r = data as Partial<Repo>;
  if (!r || r.format !== "tokenseed-repo") throw new Error("This isn't a TokenSeed repository file");
  if (r.version !== 1) throw new Error(`Unsupported repository version ${String(r.version)}`);
  if (!r.snapshots || !r.branches || !r.head || !r.working || typeof r.name !== "string") throw new Error("Repository file is incomplete");
  for (const [id, s] of Object.entries(r.snapshots)) {
    if (s.id !== id || !s.seed) throw new Error(`Snapshot ${id} is damaged`);
    if (s.parent && !r.snapshots[s.parent]) throw new Error(`Snapshot ${id} points at a missing parent`);
  }
  for (const [name, id] of Object.entries(r.branches)) if (!r.snapshots[id]) throw new Error(`Branch ${name} points at a missing snapshot`);
  const repo = { tags: {}, ...r } as Repo;
  headSnapshot(repo);
  return opts.newId ? { ...repo, id: newId() } : repo;
}
