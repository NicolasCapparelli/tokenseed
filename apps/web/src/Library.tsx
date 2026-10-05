import { exportBundle, generate, log, type Repo } from "@tokenseed/core";
import { AuroraFixedScope } from "@aurora/react";
import { useMemo, useRef } from "react";
import { chromeFor } from "./aurora";
import { ago, download, slug } from "./download";
import { Specimen } from "./Specimen";
import type { useWorkspace } from "./state";

type Lib = ReturnType<typeof useWorkspace>["library"];

function Card({ repo, current, lib, onOpen, mode }: { repo: Repo; current: boolean; lib: Lib; onOpen: () => void; mode: "light" | "dark" }) {
  const system = useMemo(() => generate(repo.working), [repo.working]);
  const { variant, texture } = useMemo(() => chromeFor(system, mode), [system, mode]);
  return (
    <AuroraFixedScope className="lib-scope" variant={variant} texture={texture}>
    <article className={`lib-card${current ? " current" : ""}`}>
      {/* The Open button below is the keyboard path; the preview is a larger click target. */}
      <div className="lib-preview" onClick={onOpen}>
        <Specimen system={system} mode={mode} compact />
      </div>
      <div className="lib-info">
        <strong>{repo.name}</strong>
        <small>
          {log(repo).length} snapshot{log(repo).length === 1 ? "" : "s"} · {Object.keys(repo.branches).length} branch
          {Object.keys(repo.branches).length === 1 ? "" : "es"} · {ago(repo.updatedAt)}
        </small>
        {repo.forkedFrom && <small>Forked from {repo.forkedFrom.name}</small>}
      </div>
      <div className="lib-actions">
        <button onClick={onOpen}>{current ? "Back to it" : "Open"}</button>
        <button onClick={() => lib.fork(repo.id)}>Fork</button>
        <button onClick={() => download(`${slug(repo.name)}.tokenseed`, exportBundle(repo), "application/json")}>Export</button>
        <button className="danger" onClick={() => confirm(`Delete “${repo.name}” and all its history? This can't be undone.`) && lib.remove(repo.id)}>
          Delete
        </button>
      </div>
    </article>
    </AuroraFixedScope>
  );
}

/** Every system on this device. Each one is a repository with its own history. */
export function Library({ lib, currentId, onOpen, mode }: { lib: Lib; currentId?: string; onOpen: () => void; mode: "light" | "dark" }) {
  const file = useRef<HTMLInputElement>(null);
  return (
    <section className="library">
      <div className="section-head">
        <h2>Your systems</h2>
        <span className="knob-help">Stored in this browser. Export a system to move it or share it.</span>
        <span className="spacer" />
        <input ref={file} type="file" accept=".tokenseed,.json,application/json" hidden
          onChange={async (e) => { const f = e.target.files?.[0]; if (f) { await lib.import(await f.text()); onOpen(); } e.target.value = ""; }} />
        <button onClick={() => file.current?.click()}>Import</button>
        <button className="primary" onClick={async () => { await lib.create(prompt("Name your system", "Untitled system") ?? "Untitled system"); onOpen(); }}>
          New system
        </button>
      </div>
      <div className="lib-grid">
        {lib.list.map((r) => (
          <Card key={r.id} repo={r} current={r.id === currentId} lib={lib} mode={mode}
            onOpen={async () => { await lib.open(r.id); onOpen(); }} />
        ))}
      </div>
    </section>
  );
}
