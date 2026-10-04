import {
  catalog,
  flatten,
  generate,
  stylePresets,
  traits,
  variations,
  type GeneratedSystem,
  type Knob,
  type Seed,
} from "@tokenseed/core";
import { useEffect, useMemo, useState } from "react";
import { ExportPanel } from "./ExportPanel";
import { loadFonts } from "./fonts";
import { KnobControl } from "./KnobControl";
import { Specimen } from "./Specimen";
import { useSeed, type Level } from "./state";

const LEVELS: { id: Level; name: string; subtitle: string }[] = [
  { id: "sprout", name: "Sprout", subtitle: "Give us a color and a vibe, get a full system" },
  { id: "grow", name: "Grow", subtitle: "Step through each part with suggestions" },
  { id: "craft", name: "Craft", subtitle: "Every knob and token, by hand" },
];

const GROUP_ORDER = [...new Set(catalog.map((k) => k.group))];

function fontsOf(system: GeneratedSystem): string[] {
  return ["heading", "body", "mono"].map((f) => {
    const fam = (system.base.font as Record<string, Record<string, { $value: string[] }>>).family![f]!.$value;
    return fam[0]!;
  });
}

export function App() {
  const { seed, setSeed, setKnob, setTrait, toggleLock, togglePreset, reset } = useSeed();
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

  const knobsFor = (lvl: Level) => catalog.filter((k) => k.levels.includes(lvl));
  const failing = system.checks.filter((c) => !c.pass);

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
    GROUP_ORDER.map((g) => [g, knobsFor(lvl).filter((k) => k.group === g && !(lvl === "grow" && k.required))] as const).filter(([, ks]) => ks.length);

  return (
    <div className="app" data-app-theme={mode}>
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>❋</span> TokenSeed
        </div>
        <nav className="levels" aria-label="Level">
          {LEVELS.map((l) => (
            <button key={l.id} className={level === l.id ? "on" : ""} onClick={() => { setLevel(l.id); setExploreGroup(null); }} title={l.subtitle}>
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
          <button onClick={() => confirm("Start a new system? This replaces the current one.") && reset()}>New</button>
        </div>
      </header>

      <div className="layout">
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
                      <Specimen system={o.system} mode={mode} compact />
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
            <Specimen system={system} mode={mode} />
            {system.resolved.warnings.length > 0 && <p className="knob-help">{system.resolved.warnings.join(". ")}</p>}
          </section>

          {level === "craft" && <TokenTable system={system} mode={mode} />}

          <section>
            <div className="section-head"><h2>Export</h2></div>
            <ExportPanel system={system} />
          </section>
        </main>
      </div>
    </div>
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

function TokenTable({ system, mode }: { system: GeneratedSystem; mode: "light" | "dark" }) {
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
