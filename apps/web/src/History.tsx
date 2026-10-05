import {
  currentBranch,
  diffSeeds,
  diffTokens,
  generate,
  headSnapshot,
  isDirty,
  knobById,
  log,
  presetById,
  refsBySnapshot,
  traitById,
  type GeneratedSystem,
  type Repo,
  type SeedChange,
  type Snapshot,
  type TokenChange,
} from "@tokenseed/core";
import { useMemo, useState } from "react";
import { ago } from "./download";
import type { useWorkspace } from "./state";

type Vcs = ReturnType<typeof useWorkspace>["vcs"];

function label(c: SeedChange): string {
  if (c.kind === "knob") return knobById.get(c.id)?.label ?? c.id;
  if (c.kind === "trait") {
    const t = traitById.get(c.id);
    return t ? `${t.label[0]} ↔ ${t.label[1]}` : c.id;
  }
  if (c.kind === "preset") return `Preset ${presetById.get(c.id)?.label ?? c.id}`;
  if (c.kind === "lock") return `Lock on ${knobById.get(c.id)?.label ?? c.id}`;
  return c.id;
}

const show = (v: unknown) => (v === undefined ? "–" : typeof v === "object" ? JSON.stringify(v) : String(v));

function ChangeList({ changes }: { changes: SeedChange[] }) {
  if (!changes.length) return <p className="knob-help">No input changes.</p>;
  return (
    <ul className="changes">
      {changes.map((c) => (
        <li key={`${c.kind}:${c.id}`}>
          <span>{label(c)}</span>
          <span className="change-values">
            {c.kind === "preset" || c.kind === "lock" ? (c.to !== undefined ? "added" : "removed") : <>{show(c.from)} → {show(c.to)}</>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TokenValue({ v }: { v: unknown }) {
  if (v && typeof v === "object" && "hex" in v) {
    const hex = (v as { hex: string }).hex;
    return <span className="token-value"><i className="swatch" style={{ background: hex }} />{hex}</span>;
  }
  if (v && typeof v === "object" && "value" in v && "unit" in v) {
    const d = v as { value: number; unit: string };
    return <span className="token-value">{d.value}{d.unit}</span>;
  }
  return <span className="token-value">{v === undefined ? "–" : JSON.stringify(v).slice(0, 48)}</span>;
}

function Compare({ snapshot, system, onClose }: { snapshot: Snapshot; system: GeneratedSystem; onClose: () => void }) {
  const seedChanges = useMemo(() => diffSeeds(snapshot.seed, system.seed), [snapshot, system]);
  const tokenChanges = useMemo<TokenChange[]>(() => diffTokens(generate(snapshot.seed), system), [snapshot, system]);
  return (
    <div className="compare">
      <div className="section-head">
        <h3>“{snapshot.message}” vs. now</h3>
        <span className="spacer" />
        <button className="link" onClick={onClose}>Close</button>
      </div>
      <h4>Inputs</h4>
      <ChangeList changes={seedChanges} />
      <h4>Tokens <small>{tokenChanges.length} changed</small></h4>
      <ul className="changes">
        {tokenChanges.slice(0, 120).map((c) => (
          <li key={`${c.mode}:${c.path}`}>
            <code>{c.path}</code>
            {c.mode !== "base" && <small className="mode-tag">{c.mode}</small>}
            <span className="change-values"><TokenValue v={c.from} /> → <TokenValue v={c.to} /></span>
          </li>
        ))}
      </ul>
      {tokenChanges.length > 120 && <p className="knob-help">And {tokenChanges.length - 120} more.</p>}
    </div>
  );
}

/** Snapshots, branches and tags for the open system. */
export function History({ repo, system, vcs }: { repo: Repo; system: GeneratedSystem; vcs: Vcs }) {
  const [message, setMessage] = useState("");
  const [comparing, setComparing] = useState<Snapshot | null>(null);
  const dirty = isDirty(repo);
  const head = headSnapshot(repo);
  const onBranch = currentBranch(repo);
  const refs = refsBySnapshot(repo);
  const pending = useMemo(() => (dirty ? diffSeeds(head.seed, repo.working) : []), [dirty, head, repo.working]);

  const switchTo = (ref: string) => {
    if (dirty && !confirm("You have changes that aren't in a snapshot. Switch anyway and lose them?")) return;
    vcs.checkout(ref, true);
  };

  return (
    <div className="history">
      <div className="branch-row">
        <label htmlFor="branch">Branch</label>
        <select id="branch" value={onBranch ?? ""} onChange={(e) => switchTo(e.target.value)}>
          {!onBranch && <option value="">Viewing {head.id.slice(0, 7)}</option>}
          {Object.keys(repo.branches).map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <button onClick={() => { const n = prompt("Name the new branch (for an experiment, e.g. rounder-buttons)"); if (n) vcs.branch(n.trim()); }}>
          New branch
        </button>
      </div>

      <form className="commit-box" onSubmit={(e) => { e.preventDefault(); vcs.commit(message); setMessage(""); }}>
        <div className="section-head">
          <h3>{dirty ? `${pending.length} unsaved change${pending.length === 1 ? "" : "s"}` : "Everything is saved in a snapshot"}</h3>
          <span className="spacer" />
          {dirty && <button type="button" className="link" onClick={() => confirm("Discard all changes since the last snapshot?") && vcs.discard()}>Discard</button>}
        </div>
        {dirty && <ChangeList changes={pending} />}
        <input type="text" placeholder="What changed? e.g. Warmer neutrals" value={message} onChange={(e) => setMessage(e.target.value)} disabled={!dirty} />
        <button type="submit" className="primary" disabled={!dirty}>Save snapshot</button>
      </form>

      <ol className="log">
        {log(repo).map((s) => {
          const r = refs[s.id];
          return (
            <li key={s.id} className={s.id === head.id ? "current" : ""}>
              <div className="log-head">
                <strong>{s.message}</strong>
                {r?.branches.map((b) => <span key={b} className="ref branch">{b}</span>)}
                {r?.tags.map((t) => <span key={t} className="ref tag">{t}</span>)}
              </div>
              <div className="log-meta">
                <code>{s.id.slice(0, 7)}</code> · {ago(s.createdAt)} · engine {s.engine}
              </div>
              <div className="log-actions">
                <button className="link" onClick={() => setComparing(s)}>Compare</button>
                {s.id !== head.id && <button className="link" onClick={() => switchTo(s.id)}>View</button>}
                {s.id !== head.id && <button className="link" onClick={() => vcs.restore(s.id)}>Restore</button>}
                <button className="link" onClick={() => { const n = prompt("Release name, e.g. v1.0"); if (n) vcs.tag(n.trim(), undefined, s.id); }}>Tag</button>
                <button className="link" onClick={() => { const n = prompt("Name the new branch"); if (n) vcs.branch(n.trim(), s.id); }}>Branch</button>
              </div>
            </li>
          );
        })}
      </ol>
      {repo.forkedFrom && <p className="knob-help">Forked from {repo.forkedFrom.name} at {repo.forkedFrom.snapshot.slice(0, 7)}.</p>}
      {comparing && <Compare snapshot={comparing} system={system} onClose={() => setComparing(null)} />}
    </div>
  );
}
