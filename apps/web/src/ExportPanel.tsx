import type { GeneratedSystem } from "@tokenseed/core";
import { toCss, toDesignMd, toDtcgFiles, toTailwind } from "@tokenseed/core";
import { useMemo, useState } from "react";

type Tab = "css" | "tailwind" | "design.md" | "dtcg";

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "system";

export function ExportPanel({ system }: { system: GeneratedSystem }) {
  const [tab, setTab] = useState<Tab>("design.md");
  const files = useMemo(() => toDtcgFiles(system), [system]);
  const [dtcgFile, setDtcgFile] = useState("resolved/light.tokens.json");
  const content = useMemo(() => {
    if (tab === "css") return { name: "tokens.css", text: toCss(system) };
    if (tab === "tailwind") return { name: "theme.css", text: toTailwind(system) };
    if (tab === "design.md") return { name: "DESIGN.md", text: toDesignMd(system) };
    const name = files[dtcgFile] ? dtcgFile : Object.keys(files)[0]!;
    return { name, text: files[name]! };
  }, [tab, system, files, dtcgFile]);

  return (
    <div className="export">
      <div className="tabs" role="tablist">
        {(["design.md", "css", "tailwind", "dtcg"] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
            {{ css: "CSS", tailwind: "Tailwind", "design.md": "DESIGN.md", dtcg: "DTCG JSON" }[t]}
          </button>
        ))}
        <span className="spacer" />
        {tab === "dtcg" && (
          <select value={content.name} onChange={(e) => setDtcgFile(e.target.value)} aria-label="File">
            {Object.keys(files).map((f) => <option key={f}>{f}</option>)}
          </select>
        )}
        <button onClick={() => navigator.clipboard.writeText(content.text)}>Copy</button>
        <button onClick={() => download(`${slug(system.name)}-${content.name.replace(/\//g, "-")}`, content.text)}>Download</button>
        {tab === "dtcg" && (
          <button onClick={() => download(`${slug(system.name)}.tokenseed.json`, JSON.stringify(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, JSON.parse(v)])), null, 2))}>
            Download all
          </button>
        )}
      </div>
      <pre className="code">{content.text}</pre>
    </div>
  );
}
