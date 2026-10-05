import type { GeneratedSystem } from "@tokenseed/core";
import { toCss, toDesignMd, toDtcgFiles, toTailwind } from "@tokenseed/core";
import { auroraBundleFileName, exportAuroraBundle, stringifyAuroraBundle } from "@tokenseed/aurora";
import { useMemo, useState } from "react";
import { download, slug } from "./download";

type Tab = "css" | "tailwind" | "design.md" | "dtcg" | "aurora";


export function ExportPanel({ system }: { system: GeneratedSystem }) {
  const [tab, setTab] = useState<Tab>("design.md");
  const files = useMemo(() => toDtcgFiles(system), [system]);
  const [dtcgFile, setDtcgFile] = useState("resolved/light.tokens.json");
  const aurora = useMemo(() => {
    if (tab !== "aurora") return undefined;
    const bundle = exportAuroraBundle(system);
    return { name: auroraBundleFileName(bundle), text: stringifyAuroraBundle(bundle) };
  }, [tab, system]);
  const content = useMemo(() => {
    if (aurora) return aurora;
    if (tab === "css") return { name: "tokens.css", text: toCss(system) };
    if (tab === "tailwind") return { name: "theme.css", text: toTailwind(system) };
    if (tab === "design.md") return { name: "DESIGN.md", text: toDesignMd(system) };
    const name = files[dtcgFile] ? dtcgFile : Object.keys(files)[0]!;
    return { name, text: files[name]! };
  }, [aurora, tab, system, files, dtcgFile]);

  return (
    <div className="export">
      <div className="tabs" role="tablist">
        {(["design.md", "css", "tailwind", "dtcg", "aurora"] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
            {{ css: "CSS", tailwind: "Tailwind", "design.md": "DESIGN.md", dtcg: "DTCG JSON", aurora: "Aurora (Flutter)" }[t]}
          </button>
        ))}
        <span className="spacer" />
        {tab === "dtcg" && (
          <select value={content.name} onChange={(e) => setDtcgFile(e.target.value)} aria-label="File">
            {Object.keys(files).map((f) => <option key={f}>{f}</option>)}
          </select>
        )}
        <button onClick={() => navigator.clipboard.writeText(content.text)}>Copy</button>
        <button onClick={() => download(tab === "aurora" ? content.name : `${slug(system.name)}-${content.name.replace(/\//g, "-")}`, content.text, tab === "aurora" ? "application/json" : "text/plain")}>Download</button>
        {tab === "dtcg" && (
          <button onClick={() => download(`${slug(system.name)}-dtcg.json`, JSON.stringify(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, JSON.parse(v)])), null, 2))}>
            Download all
          </button>
        )}
      </div>
      {tab === "aurora" && (
        <p className="knob-help export-note">
          Install in a Flutter app: <code>dart run aurora install --bundle {content.name} --project .</code>
        </p>
      )}
      <pre className="code">{content.text}</pre>
    </div>
  );
}
