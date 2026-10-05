import {
  catalog,
  currentBranch,
  flatten,
  generate,
  isDirty,
  knobGroups,
  stylePresets,
  traits,
  variations,
  type GeneratedSystem,
  type Knob,
  type KnobValue,
  type ModeName,
  type Seed,
} from "@tokenseed/core";
import { AuroraFixedScope, type AuroraScopeHandle } from "@aurora/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { chromeFor } from "./aurora";
import { ExportPanel } from "./ExportPanel";
import { loadFonts } from "./fonts";
import { History } from "./History";
import { KnobControl } from "./KnobControl";
import { Library } from "./Library";
import { Specimen } from "./Specimen";
import { useWorkspace, type Level } from "./state";

const LEVELS: { id: Level; name: string; subtitle: string }[] = [
  { id: "sprout", name: "Sprout", subtitle: "Give us a color and a vibe, get a full system" },
  { id: "grow", name: "Grow", subtitle: "Step through each part with suggestions" },
  { id: "craft", name: "Craft", subtitle: "Every knob and token, by hand" },
];

function fontsOf(system: GeneratedSystem): string[] {
  const families = (system.base.font as Record<string, Record<string, { $value: string[] }>>).family!;
  return Object.values(families).map((f) => f.$value[0]!);
}

/** A knob is shown only when every knob it depends on has one of the listed values. */
const visible = (k: Knob, values: Record<string, KnobValue>) =>
  !k.visibleWhen || Object.entries(k.visibleWhen).every(([id, allowed]) => allowed.some((a) => a === values[id]));

export function App() {
  const ws = useWorkspace();
  if (!ws.repo) return <div className="app loading">Opening your library…</div>;
  return <Editor ws={ws as Workspace} />;
}

type Workspace = ReturnType<typeof useWorkspace> & { repo: NonNullable<ReturnType<typeof useWorkspace>["repo"]> };

function Editor({ ws }: { ws: Workspace }) {
  const { repo, setSeed, setKnob, setTrait, toggleLock, togglePreset, vcs, library } = ws;
  const seed = repo.working;
  const [view, setView] = useState<"edit" | "library">("edit");
  const [showHistory, setShowHistory] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [level, setLevel] = useState<Level>("sprout");
  const [mode, setMode] = useState<"light" | "dark">(() =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  const [exploreGroup, setExploreGroup] = useState<string | null>(null);
  const [shuffle, setShuffle] = useState(0);

  const system = useMemo(() => generate(seed), [seed]);
  const options = useMemo(() => {
    const base: Seed = { ...seed, random: seed.random + shuffle * 7 };
    return variations(base, exploreGroup ? { groups: [exploreGroup] } : {}).map((s) => ({ seed: s, system: generate(s) }));
  }, [seed, shuffle, exploreGroup]);

  useEffect(() => loadFonts([system, ...options.map((o) => o.system)].flatMap(fontsOf)), [system, options]);

  const knobsFor = (lvl: Level) => catalog.filter((k) => k.levels.includes(lvl) && visible(k, system.resolved.values));
  const failing = system.checks.filter((c) => !c.pass);
  const hasHc = system.modes.some((m) => m.endsWith("-hc"));
  const previewMode = (highContrast && hasHc ? `${mode}-hc` : mode) as ModeName;
  const chrome = useMemo(() => chromeFor(system, mode), [system, mode]);
  const scope = useRef<AuroraScopeHandle>(null);
  // Live theming: write the changed CSS variables straight to the scope element, without re-rendering the chrome.
  useLayoutEffect(() => scope.current?.update(chrome.variant, chrome.texture), [chrome]);
  const dirty = isDirty(repo);
  const branchName = currentBranch(repo);

  const control = (k: Knob) => (
    <KnobControl
      key={k.id}
      knob={k}
      value={system.resolved.values[k.id]!}
      source={system.resolved.sources[k.id]}
      explicit={k.id in seed.knobs}
      locked={seed.locks.includes(k.id)}
      onChange={(v) => setKnob(k.id, v)}
      onToggleLock={() => toggleLock(k.id)}
    />
  );

  const groupsFor = (lvl: Level) =>
    knobGroups.map((g) => [g, knobsFor(lvl).filter((k) => k.group === g && !(lvl === "grow" && k.required))] as const).filter(([, ks]) => ks.length);

  return (
    <AuroraFixedScope ref={scope} className="aurora-root" variant={chrome.variant} texture={chrome.texture}>
    <div className="app" data-app-theme={mode}>
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>❋</span> TokenSeed
        </div>
        <button className={`repo-button${view === "library" ? " on" : ""}`} onClick={() => setView(view === "library" ? "edit" : "library")} title="All your systems">
          <strong>{repo.name}</strong>
          <small>{branchName ?? "viewing a snapshot"}{dirty ? " · unsaved changes" : ""}</small>
        </button>
        <nav className="levels" aria-label="Level" hidden={view === "library"}>
          {LEVELS.map((l) => (
            <button key={l.id} className={level === l.id ? "on" : ""} onClick={() => { setLevel(l.id); setExploreGroup(null); setView("edit"); }} title={l.subtitle}>
              <strong>{l.name}</strong>
              <small>{l.subtitle}</small>
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <div className="segmented" role="radiogroup" aria-label="Preview mode">
            {(["light", "dark"] as const).map((m) => (
              <button key={m} role="radio" aria-checked={mode === m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>{m}</button>
            ))}
          </div>
          {hasHc && (
            <label className="hc-toggle"><input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} /> High contrast</label>
          )}
          <button className={showHistory ? "on" : ""} onClick={() => { setShowHistory(!showHistory); setView("edit"); }} aria-pressed={showHistory}>
            History{dirty && <span className="dot" aria-label="unsaved changes" />}
          </button>
        </div>
      </header>

      {ws.error && (
        <div className="banner" role="alert">{ws.error}<button className="link" onClick={ws.clearError}>Dismiss</button></div>
      )}

      {view === "library" ? (
        <main className="main"><Library lib={library} currentId={repo.id} mode={mode} onOpen={() => setView("edit")} /></main>
      ) : (
      <div className={`layout${showHistory ? " with-history" : ""}`}>
        <aside className="panel">
          {level === "sprout" && (
            <>
              <h3>Essentials</h3>
              {knobsFor("sprout").map(control)}
              <h3>Style presets</h3>
              <p className="knob-help">Stack any of these on top of your product type.</p>
              <div className="chips">
                {stylePresets.map((p) => (
                  <button key={p.id} className={`chip${seed.presets.includes(p.id) ? " on" : ""}`} title={p.description} onClick={() => togglePreset(p.id)}>
                    {p.label}
                  </button>
                ))}
              </div>
              <h3>Personality</h3>
              <p className="knob-help">Untouched sliders stay open, so the options on the right can explore them.</p>
              {traits.map((t) => {
                const set = t.id in seed.traits;
                return (
                  <div key={t.id} className={`trait${set ? "" : " unset"}`}>
                    <div className="trait-labels">
                      <span>{t.label[0]}</span>
                      {set ? <button className="link" onClick={() => setTrait(t.id, undefined)}>clear</button> : <small>open</small>}
                      <span>{t.label[1]}</span>
                    </div>
                    <input type="range" min={0} max={1} step={0.01} value={seed.traits[t.id] ?? 0.5} aria-label={`${t.label[0]} to ${t.label[1]}`}
                      title={t.help} onChange={(e) => setTrait(t.id, Number(e.target.value))} />
                  </div>
                );
              })}
            </>
          )}

          {level !== "sprout" && groupsFor(level).map(([group, knobs]) => (
            <details key={group} open={level === "grow"}>
              <summary>
                {group}
                {level === "grow" && (
                  <button className="link" onClick={(e) => { e.preventDefault(); setExploreGroup(group); }}>Show options</button>
                )}
              </summary>
              {knobs.map(control)}
            </details>
          ))}

          {level === "craft" && <SeedEditor seed={seed} onApply={setSeed} />}
        </aside>

        <main className="main">
          {level !== "craft" && (
            <section className="options">
              <div className="section-head">
                <h2>{exploreGroup ? `Options for ${exploreGroup}` : "Pick the one you like"}</h2>
                <span className="spacer" />
                {exploreGroup && <button className="link" onClick={() => setExploreGroup(null)}>Whole system</button>}
                {options.length > 0 && <button onClick={() => setShuffle((n) => n + 1)}>Shuffle</button>}
              </div>
              {options.length === 0 ? (
                <p className="knob-help">Everything here is decided or locked, so there's nothing to suggest. Unlock or reset a knob to get options.</p>
              ) : (
                <div className="option-grid">
                  {options.map((o, i) => (
                    <div key={i} className="option" onClick={() => { setSeed(o.seed); setShuffle(0); }}>
                      <Specimen system={o.system} mode={previewMode} compact />
                      <button className="option-cta">Use this</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section>
            <div className="section-head">
              <h2>Preview</h2>
              <span className="spacer" />
              <span className={failing.length ? "pill bad" : "pill good"}>
                {failing.length ? `${failing.length} contrast issue${failing.length > 1 ? "s" : ""}` : `All ${system.checks.length} contrast checks pass`}
              </span>
            </div>
            <Specimen system={system} mode={previewMode} />
            {system.resolved.warnings.length > 0 && <p className="knob-help">{system.resolved.warnings.join(". ")}</p>}
          </section>

          {level === "craft" && <TokenTable system={system} mode={previewMode} />}

          <section>
            <div className="section-head"><h2>Export</h2></div>
            <ExportPanel system={system} />
          </section>
        </main>
        {showHistory && (
          <aside className="panel history-panel" aria-label="History">
            <History repo={repo} system={system} vcs={vcs} />
          </aside>
        )}
      </div>
      )}
    </div>
    </AuroraFixedScope>
  );
}

function SeedEditor({ seed, onApply }: { seed: Seed; onApply: (s: Seed) => void }) {
  const [text, setText] = useState(() => JSON.stringify(seed, null, 2));
  const [error, setError] = useState("");
  useEffect(() => setText(JSON.stringify(seed, null, 2)), [seed]);
  return (
    <details>
      <summary>Seed (raw)</summary>
      <textarea className="code" rows={16} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      {error && <p className="error">{error}</p>}
      <button onClick={() => {
        try { onApply(JSON.parse(text)); setError(""); } catch (e) { setError(String(e)); }
      }}>Apply seed</button>
    </details>
  );
}

function TokenTable({ system, mode }: { system: GeneratedSystem; mode: ModeName }) {
  const m = system.modes.includes(mode) ? mode : system.modes[0]!;
  const rows = [...flatten(system.themes[m] ?? {}).map(([p, t]) => [p, t, m] as const), ...flatten(system.base).map(([p, t]) => [p, t, "base"] as const)];
  return (
    <section>
      <div className="section-head"><h2>Tokens</h2><span className="knob-help">{rows.length} tokens · {m} mode</span></div>
      <div className="token-table">
        <table>
          <thead><tr><th>Token</th><th>Type</th><th>Set</th><th>Value</th><th>From</th></tr></thead>
          <tbody>
            {rows.map(([p, t, set]) => (
              <tr key={`${set}:${p}`} title={t.$description}>
                <td><code>{p}</code></td>
                <td>{t.$type}</td>
                <td>{set}</td>
                <td><code>{typeof t.$value === "string" ? t.$value : (t.$value as { hex?: string }).hex ?? JSON.stringify(t.$value).slice(0, 60)}</code></td>
                <td>{t.$extensions?.["com.tokenseed"]?.generator}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
