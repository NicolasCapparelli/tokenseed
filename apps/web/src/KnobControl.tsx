import type { Knob, KnobValue, Source } from "@tokenseed/core";
import { presetById, traitById } from "@tokenseed/core";

function sourceLabel(source: Source | undefined): string {
  if (!source) return "";
  switch (source.kind) {
    case "default": return "default";
    case "user": return "you set this";
    case "preset": return `from ${presetById.get(source.id)?.label ?? source.id}`;
    case "trait": {
      const t = traitById.get(source.id);
      return t ? `from ${t.label[0]} ↔ ${t.label[1]}` : source.id;
    }
  }
}

interface Props {
  knob: Knob;
  value: KnobValue;
  source?: Source;
  explicit: boolean;
  locked: boolean;
  onChange: (v: KnobValue | undefined) => void;
  onToggleLock: () => void;
}

/** One control, chosen from the knob definition. Adding a knob to core adds it here automatically. */
export function KnobControl({ knob, value, source, explicit, locked, onChange, onToggleLock }: Props) {
  let input: React.ReactNode;
  switch (knob.type) {
    case "enum":
      input =
        knob.options.length <= 4 ? (
          <div className="segmented" role="radiogroup" aria-label={knob.label}>
            {knob.options.map((o) => (
              <button key={o.value} role="radio" aria-checked={value === o.value} className={value === o.value ? "on" : ""} onClick={() => onChange(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        ) : (
          <select value={String(value)} onChange={(e) => onChange(e.target.value)} aria-label={knob.label}>
            {knob.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      break;
    case "number":
      input = (
        <div className="slider">
          <input type="range" min={knob.min} max={knob.max} step={knob.step} value={Number(value)} aria-label={knob.label}
            onChange={(e) => onChange(Number(e.target.value))} />
          <output>{Number(value)}{knob.unit ?? ""}</output>
        </div>
      );
      break;
    case "boolean":
      input = <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} aria-label={knob.label} />;
      break;
    case "color":
      input = <input type="color" value={String(value) || "#000000"} onChange={(e) => onChange(e.target.value)} aria-label={knob.label} />;
      break;
    case "colorList": {
      const list = value as string[];
      input = (
        <div className="color-list">
          {list.map((c, i) => (
            <span key={i} className="color-chip">
              <input type="color" value={c} aria-label={`${knob.label} ${i + 1}`} onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))} />
              <button className="link" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Remove">×</button>
            </span>
          ))}
          {list.length < knob.max && <button className="link" onClick={() => onChange([...list, "#e8590c"])}>+ Add</button>}
        </div>
      );
      break;
    }
    default:
      input = (
        <input type="text" value={String(value)} placeholder={knob.type === "font" ? "Choose for me" : ""} aria-label={knob.label}
          onChange={(e) => onChange(e.target.value)} />
      );
  }

  return (
    <div className="knob">
      <div className="knob-head">
        <label title={knob.help}>{knob.label}</label>
        <span className="knob-source">{sourceLabel(source)}</span>
        {explicit && <button className="link" onClick={() => onChange(undefined)} title="Go back to the preset or trait value">reset</button>}
        {knob.explorable !== false && (
          <button className={`lock${locked ? " on" : ""}`} onClick={onToggleLock} title={locked ? "Unlock" : "Lock so options and shuffle won't change it"} aria-pressed={locked}>
            {locked ? "🔒" : "🔓"}
          </button>
        )}
      </div>
      <p className="knob-help">{knob.help}</p>
      {input}
    </div>
  );
}
