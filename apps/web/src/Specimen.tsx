import type { GeneratedSystem } from "@tokenseed/core";
import { toCss } from "@tokenseed/core";
import { useMemo } from "react";

let counter = 0;

/** Renders a sample screen styled only by the system's CSS variables, scoped to this element. */
export function Specimen({ system, mode, compact = false }: { system: GeneratedSystem; mode: "light" | "dark"; compact?: boolean }) {
  const scope = useMemo(() => `ts-scope-${++counter}`, []);
  const css = useMemo(() => toCss(system, { selector: `.${scope}` }), [system, scope]);
  const theme = system.modes.includes(mode) ? mode : system.modes[0];

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
        </div>
      )}
    </div>
  );
}
