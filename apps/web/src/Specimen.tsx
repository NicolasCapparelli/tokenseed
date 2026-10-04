import type { GeneratedSystem, ModeName } from "@tokenseed/core";
import { toCss } from "@tokenseed/core";
import { useMemo } from "react";

let counter = 0;

/** Renders a sample screen styled only by the system's CSS variables, scoped to this element. */
export function Specimen({ system, mode, compact = false }: { system: GeneratedSystem; mode: ModeName; compact?: boolean }) {
  const scope = useMemo(() => `ts-scope-${++counter}`, []);
  const css = useMemo(() => toCss(system, { selector: `.${scope}` }), [system, scope]);
  const categorical = Object.keys((system.base.dataviz as { categorical?: Record<string, unknown> } | undefined)?.categorical ?? {});
  const hasDataviz = categorical.length > 0;
  const hasGradient = system.modes.some((m) => !!(system.themes[m] as { gradient?: unknown } | undefined)?.gradient);
  const theme = system.modes.includes(mode) ? mode : system.modes.find((m) => m.startsWith(mode.slice(0, 4))) ?? system.modes[0];

  return (
    <div className={`${scope} specimen${compact ? " specimen--compact" : ""}`} data-theme={theme}>
      <style>{css}</style>
      <header className="sp-hero">
        <span className="sp-overline">Overview</span>
        <h1 className="sp-display">{system.name}</h1>
        <p className="sp-body sp-secondary">Your balance is ready. Everything important is the biggest thing on screen.</p>
        <div className="sp-row">
          <button className="sp-btn sp-btn--primary">Get started</button>
          <button className="sp-btn sp-btn--secondary">Learn more</button>
        </div>
      </header>
      {!compact && (
        <div className="sp-grid">
          <section className="sp-card">
            <h2 className="sp-headline">Account</h2>
            <p className="sp-body sp-secondary">Cards group related content and actions.</p>
            <label className="sp-label" htmlFor={`${scope}-email`}>Email</label>
            <input id={`${scope}-email`} className="sp-input" placeholder="you@example.com" />
            <p className="sp-small">We'll never share it. <a className="sp-link" href="#specimen">Privacy</a></p>
          </section>
          <section className="sp-card">
            <h2 className="sp-headline">Status</h2>
            <div className="sp-row sp-wrap">
              {["success", "warning", "danger", "info"].map((s) => (
                <span key={s} className="sp-badge" style={{ background: `var(--ts-color-status-${s}-subtle)`, color: `var(--ts-color-status-${s}-onSubtle)` }}>
                  {s}
                </span>
              ))}
            </div>
            <div className="sp-alert">
              <strong>Payment received.</strong> Status colors always come with words.
            </div>
            <ul className="sp-list">
              <li><span>Boarding</span><span className="sp-secondary">7:40 PM</span></li>
              <li><span>Gate</span><span className="sp-secondary">B12</span></li>
              <li><span>Seat</span><span className="sp-secondary">14C</span></li>
            </ul>
          </section>
          <section className="sp-card">
            <div className="sp-tabs" role="tablist">
              {["Overview", "Activity", "Settings"].map((t, i) => (
                <span key={t} role="tab" aria-selected={i === 0} className={`sp-tab${i === 0 ? " sp-tab--on" : ""}`}>{t}</span>
              ))}
            </div>
            <table className="sp-table">
              <thead><tr><th>Order</th><th>Status</th><th className="sp-num">Total</th></tr></thead>
              <tbody>
                {[["#1042", "Paid", "$128.00"], ["#1043", "Pending", "$64.50"], ["#1044", "Refunded", "$12.00"]].map(([o, st, t]) => (
                  <tr key={o}><td>{o}</td><td>{st}</td><td className="sp-num">{t}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="sp-row sp-wrap">
              {["Design", "Tokens", "Export"].map((c) => <span key={c} className="sp-chip">{c}</span>)}
            </div>
          </section>
          {hasDataviz && (
            <section className="sp-card">
              <h2 className="sp-headline">Chart colors</h2>
              <div className="sp-bars">
                {categorical.map((n, i) => (
                  <span key={n} style={{ background: `var(--ts-dataviz-categorical-${n})`, height: `${30 + ((i * 37) % 60)}%` }} />
                ))}
              </div>
              <div className="sp-ramp">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => <span key={n} style={{ background: `var(--ts-dataviz-sequential-${n})` }} />)}
              </div>
              <div className="sp-ramp">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => <span key={n} style={{ background: `var(--ts-dataviz-diverging-${n})` }} />)}
              </div>
            </section>
          )}
          <section className="sp-card sp-emphasis">
            {hasGradient && <div className="sp-gradient" />}
            <h2 className="sp-headline">Emphasis</h2>
            <p className="sp-body">Large brand areas use the emphasis pair, so text stays readable.</p>
            <div className="sp-toast" role="status">Snapshot saved <button className="sp-toast-action">Undo</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
