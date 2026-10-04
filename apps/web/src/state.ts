import {
  branch as vcsBranch,
  checkout as vcsCheckout,
  commit as vcsCommit,
  createRepo,
  createSeed,
  discard as vcsDiscard,
  edit,
  fork as vcsFork,
  importBundle,
  restore as vcsRestore,
  tag as vcsTag,
  type KnobValue,
  type Repo,
  type Seed,
} from "@tokenseed/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { deleteRepo, getRepo, listRepos, putRepo } from "./storage";

export type Level = "sprout" | "grow" | "craft";

const LAST = "tokenseed.lastRepo";
const LEGACY_SEED = "tokenseed.v0.seed";

export const starterSeed = (name = "My system") =>
  createSeed(
    { "identity.name": name, "color.primary": "#3b5bdb", "identity.productType": "saas", "identity.modes": "both" },
    { random: Math.floor(Math.random() * 100000) },
  );

const remember = (id: string) => {
  try { localStorage.setItem(LAST, id); } catch { /* not fatal */ }
};

/** Opens the last repository, migrates a v0 seed from localStorage, or creates a first system. */
async function boot(): Promise<Repo> {
  let lastId: string | null = null;
  let legacy: string | null = null;
  try {
    lastId = localStorage.getItem(LAST);
    legacy = localStorage.getItem(LEGACY_SEED);
  } catch { /* storage blocked */ }
  const last = lastId ? await getRepo(lastId) : undefined;
  if (last) return last;
  const all = await listRepos();
  if (all[0]) return all[0];
  let seed = starterSeed();
  if (legacy) {
    try { seed = JSON.parse(legacy) as Seed; } catch { /* ignore a damaged seed */ }
  }
  const repo = createRepo(String(seed.knobs["identity.name"] ?? "My system"), seed);
  await putRepo(repo);
  return repo;
}

/** The open repository (with its working seed) and the library around it. */
export function useWorkspace() {
  const [repo, setRepoState] = useState<Repo | null>(null);
  const [library, setLibrary] = useState<Repo[]>([]);
  const [error, setError] = useState("");
  const saveTimer = useRef<number | undefined>(undefined);

  const refreshLibrary = useCallback(() => listRepos().then(setLibrary), []);

  useEffect(() => {
    boot().then((r) => { setRepoState(r); remember(r.id); refreshLibrary(); });
  }, [refreshLibrary]);

  // Autosave the open repository, working changes included, shortly after each edit.
  useEffect(() => {
    if (!repo) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { putRepo(repo).then(refreshLibrary); }, 300);
    return () => window.clearTimeout(saveTimer.current);
  }, [repo, refreshLibrary]);

  /** Runs a repository operation, surfacing its error message instead of throwing. */
  const current = useRef<Repo | null>(null);
  current.current = repo;
  const act = useCallback((fn: (r: Repo) => Repo) => {
    const r = current.current;
    if (!r) return;
    try {
      const next = fn(r);
      current.current = next;
      setRepoState(next);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const update = useCallback((fn: (s: Seed) => Seed) => act((r) => {
    const working = fn(r.working);
    const name = String(working.knobs["identity.name"] ?? r.name);
    return { ...edit(r, working), name };
  }), [act]);

  const setSeed = useCallback((s: Seed) => update(() => s), [update]);

  const setKnob = useCallback((id: string, value: KnobValue | undefined) => update((s) => {
    const knobs = { ...s.knobs };
    if (value === undefined) delete knobs[id];
    else knobs[id] = value;
    return { ...s, knobs };
  }), [update]);

  const setTrait = useCallback((id: string, value: number | undefined) => update((s) => {
    const traits = { ...s.traits };
    if (value === undefined) delete traits[id];
    else traits[id] = value;
    return { ...s, traits };
  }), [update]);

  const toggleLock = useCallback((id: string) => update((s) => ({
    ...s, locks: s.locks.includes(id) ? s.locks.filter((l) => l !== id) : [...s.locks, id],
  })), [update]);

  const togglePreset = useCallback((id: string) => update((s) => ({
    ...s, presets: s.presets.includes(id) ? s.presets.filter((p) => p !== id) : [...s.presets, id],
  })), [update]);

  const vcs = {
    commit: (message: string) => act((r) => vcsCommit(r, message)),
    checkout: (ref: string, force = false) => act((r) => vcsCheckout(r, ref, { force })),
    branch: (name: string, from?: string) => act((r) => vcsBranch(r, name, { from })),
    tag: (name: string, message?: string, ref?: string) => act((r) => vcsTag(r, name, { message, ref })),
    restore: (ref: string) => act((r) => vcsRestore(r, ref)),
    discard: () => act(vcsDiscard),
  };

  const open = useCallback(async (id: string) => {
    if (repo) await putRepo(repo);
    const r = await getRepo(id);
    if (r) { setRepoState(r); remember(id); setError(""); }
  }, [repo]);

  const adopt = useCallback(async (r: Repo) => {
    if (repo) await putRepo(repo);
    await putRepo(r);
    setRepoState(r);
    remember(r.id);
    refreshLibrary();
  }, [repo, refreshLibrary]);

  const library_ = {
    list: library,
    open,
    create: (name = "Untitled system") => adopt(createRepo(name, starterSeed(name))),
    fork: async (id?: string) => {
      const source = id ? await getRepo(id) : repo;
      if (source) await adopt(vcsFork(source));
    },
    remove: async (id: string) => {
      await deleteRepo(id);
      const rest = (await listRepos()).filter((r) => r.id !== id);
      if (repo?.id === id) {
        const next = rest[0] ?? createRepo("My system", starterSeed());
        await putRepo(next);
        setRepoState(next);
        remember(next.id);
      }
      refreshLibrary();
    },
    import: async (text: string) => {
      try {
        const r = importBundle(text);
        // Importing a copy of a system already in the library keeps both.
        await adopt((await getRepo(r.id)) ? importBundle(text, { newId: true }) : r);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
  };

  return { repo, error, clearError: () => setError(""), setSeed, setKnob, setTrait, toggleLock, togglePreset, vcs, library: library_ };
}
