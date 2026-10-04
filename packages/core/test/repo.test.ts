import { describe, expect, it } from "vitest";
import {
  branch,
  checkout,
  commit,
  createRepo,
  createSeed,
  currentBranch,
  deleteBranch,
  diffSeeds,
  diffTokens,
  discard,
  edit,
  exportBundle,
  fork,
  generate,
  headSnapshot,
  importBundle,
  isDirty,
  log,
  refsBySnapshot,
  restore,
  tag,
  type Repo,
} from "../src";

const T = (n: number) => `2026-10-04T07:00:${String(n).padStart(2, "0")}.000Z`;
const seed = createSeed({ "identity.name": "Acme", "color.primary": "#3b5bdb" });
const withKnob = (r: Repo, id: string, v: unknown) => edit(r, { ...r.working, knobs: { ...r.working.knobs, [id]: v as never } });

describe("repo", () => {
  it("starts with one snapshot on main and no changes", () => {
    const r = createRepo("Acme", seed, { now: T(0), id: "a" });
    expect(currentBranch(r)).toBe("main");
    expect(log(r)).toHaveLength(1);
    expect(isDirty(r)).toBe(false);
  });

  it("commits working changes and refuses empty commits", () => {
    let r = createRepo("Acme", seed, { now: T(0), id: "a" });
    expect(() => commit(r, "nothing")).toThrow("Nothing to commit");
    r = withKnob(r, "shape.radius", 2);
    expect(isDirty(r)).toBe(true);
    r = commit(r, "Sharper corners", { now: T(1) });
    expect(isDirty(r)).toBe(false);
    expect(log(r).map((s) => s.message)).toEqual(["Sharper corners", "Create system"]);
  });

  it("names snapshots by content, reproducibly", () => {
    const a = commit(withKnob(createRepo("Acme", seed, { now: T(0), id: "a" }), "shape.radius", 2), "x", { now: T(1) });
    const b = commit(withKnob(createRepo("Acme", seed, { now: T(0), id: "b" }), "shape.radius", 2), "x", { now: T(1) });
    expect(headSnapshot(a).id).toBe(headSnapshot(b).id);
  });

  it("branches, switches and keeps branches independent", () => {
    let r = createRepo("Acme", seed, { now: T(0), id: "a" });
    r = branch(r, "rounder");
    r = commit(withKnob(r, "shape.style", "pill"), "Pill everything", { now: T(1) });
    r = checkout(r, "main");
    expect(r.working.knobs["shape.style"]).toBeUndefined();
    r = checkout(r, "rounder");
    expect(r.working.knobs["shape.style"]).toBe("pill");
    expect(() => deleteBranch(r, "rounder")).toThrow();
    expect(Object.keys(deleteBranch(checkout(r, "main"), "rounder").branches)).toEqual(["main"]);
  });

  it("protects uncommitted changes on checkout", () => {
    let r = branch(createRepo("Acme", seed, { now: T(0) }), "exp", { switchTo: false });
    r = withKnob(r, "shape.radius", 20);
    expect(() => checkout(r, "exp")).toThrow(/uncommitted/);
    expect(checkout(r, "exp", { force: true }).working.knobs["shape.radius"]).toBeUndefined();
    expect(isDirty(discard(r))).toBe(false);
  });

  it("tags releases and checks them out detached", () => {
    let r = createRepo("Acme", seed, { now: T(0) });
    r = tag(r, "v1.0", { message: "First release", now: T(1) });
    const v1 = headSnapshot(r).id;
    r = commit(withKnob(r, "type.base", 18), "Bigger text", { now: T(2) });
    r = checkout(r, "v1.0");
    expect(r.head).toEqual({ detached: v1 });
    expect(refsBySnapshot(r)[v1]!.tags).toEqual(["v1.0"]);
    expect(() => tag(r, "v1.0")).toThrow(/exists/);
  });

  it("restores an old snapshot as uncommitted changes", () => {
    let r = createRepo("Acme", seed, { now: T(0) });
    const first = headSnapshot(r).id;
    r = commit(withKnob(r, "type.base", 18), "Bigger text", { now: T(1) });
    r = restore(r, first.slice(0, 6));
    expect(isDirty(r)).toBe(true);
    expect(r.working.knobs["type.base"]).toBeUndefined();
  });

  it("forks with history and leaves the original alone", () => {
    const original = commit(withKnob(createRepo("Acme", seed, { now: T(0), id: "orig" }), "type.base", 18), "Bigger", { now: T(1) });
    let f = fork(original, { name: "Acme Dark", id: "fork", now: T(2) });
    expect(f.forkedFrom).toEqual({ repo: "orig", name: "Acme", snapshot: headSnapshot(original).id });
    expect(log(f).map((s) => s.message)).toEqual(["Fork of Acme", "Bigger", "Create system"]);
    expect(isDirty(f)).toBe(false);
    f = commit(withKnob(f, "identity.modes", "dark"), "Dark only", { now: T(4) });
    expect(log(original)).toHaveLength(2);
    expect(original.working.knobs["identity.modes"]).toBeUndefined();
  });

  it("diffs seeds and tokens", () => {
    const a = seed;
    const b = createSeed({ ...seed.knobs, "shape.radius": 2 }, { traits: { "trait.bold": 0.9 }, presets: ["style.precise"] });
    const changes = diffSeeds(a, b);
    expect(changes).toContainEqual({ kind: "knob", id: "shape.radius", to: 2 });
    expect(changes).toContainEqual({ kind: "trait", id: "trait.bold", to: 0.9 });
    expect(changes.find((c) => c.kind === "preset")?.id).toBe("style.precise");

    const tokens = diffTokens(generate(seed), generate(createSeed({ ...seed.knobs, "shape.radius": 2 })));
    expect(tokens.some((t) => t.path === "radius.md" && t.mode === "base" && t.kind === "changed")).toBe(true);
    expect(tokens.every((t) => !t.path.startsWith("color."))).toBe(true);
  });

  it("round-trips through a .tokenseed bundle and rejects bad files", () => {
    let r = createRepo("Acme", seed, { now: T(0), id: "a" });
    r = tag(commit(withKnob(r, "type.base", 18), "Bigger", { now: T(1) }), "v1", { now: T(2) });
    expect(importBundle(exportBundle(r))).toEqual(r);
    expect(importBundle(exportBundle(r), { newId: true }).id).not.toBe("a");
    expect(() => importBundle("{")).toThrow(/JSON/);
    expect(() => importBundle(JSON.stringify({ format: "other" }))).toThrow(/TokenSeed/);
    const broken = JSON.parse(exportBundle(r));
    broken.branches.main = "missing";
    expect(() => importBundle(JSON.stringify(broken))).toThrow(/missing/);
  });
});
