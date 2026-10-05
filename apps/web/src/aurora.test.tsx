import { AuroraFixedScope, auroraCssVariables, useAuroraTokens, type AuroraScopeHandle } from "@aurora/react";
import { auroraTextureFor, auroraVariantFor, toAuroraTheme } from "@tokenseed/aurora";
import { createSeed, generate, type GeneratedSystem } from "@tokenseed/core";
import { act, render } from "@testing-library/react";
import { createRef, memo } from "react";
import { describe, expect, it, vi } from "vitest";
import { chromeFor } from "./aurora";

const system = (knobs: Record<string, string | number | boolean>) => generate(createSeed({ "identity.name": "T", "color.primary": "#3b5bdb", ...knobs }));
const SYSTEMS: GeneratedSystem[] = [
  system({}),
  system({ "color.primary": "#d6336c" }),
  system({ "color.primary": "#0b7285", "type.base": 18 }),
  system({ "color.primary": "#e8590c", "shape.radius": 2 }),
];

const vars = (s: GeneratedSystem, a: "light" | "dark" = "light") => {
  const { variant, texture } = chromeFor(s, a);
  return auroraCssVariables(variant, texture);
};

describe("live theming", () => {
  it("updates through the handle without re-rendering children, writing only changed variables", () => {
    let renders = 0;
    const Child = memo(function Child() {
      renders++;
      return <span>chrome</span>;
    });
    const handle = createRef<AuroraScopeHandle>();
    const first = chromeFor(SYSTEMS[0]!, "light");
    render(
      <AuroraFixedScope ref={handle} variant={first.variant} texture={first.texture}>
        <Child />
      </AuroraFixedScope>,
    );
    expect(renders).toBe(1);
    const el = handle.current!.element!;
    expect(el).toBeTruthy();

    for (let i = 0; i < 60; i++) {
      const sys = SYSTEMS[i % SYSTEMS.length]!;
      const { variant, texture } = chromeFor(sys, i % 2 ? "dark" : "light");
      act(() => handle.current!.update(variant, texture));
    }
    // Last update: i = 59, SYSTEMS[3], dark.
    const last = vars(SYSTEMS[3]!, "dark");
    expect(renders).toBe(1);
    for (const [name, value] of Object.entries(last)) expect(el.style.getPropertyValue(name), name).toBe(value);

    // Only the variables whose values differ are written.
    const previous = last;
    const next = vars(SYSTEMS[0]!, "dark");
    const changed = Object.keys(next).filter((k) => next[k] !== previous[k]);
    expect(changed.length).toBeGreaterThan(0);
    expect(changed.length).toBeLessThan(Object.keys(next).length);
    const spy = vi.spyOn(el.style, "setProperty");
    const target = chromeFor(SYSTEMS[0]!, "dark");
    act(() => handle.current!.update(target.variant, target.texture));
    expect(spy.mock.calls.map((c) => c[0]).sort()).toEqual([...changed].sort());

    spy.mockClear();
    act(() => handle.current!.update(target.variant, target.texture));
    expect(spy).not.toHaveBeenCalled();
    // The same system rebuilt from the same seed is a different object but identical values: still nothing written.
    const twin = chromeFor(system({}), "dark");
    act(() => handle.current!.update(twin.variant, twin.texture));
    expect(spy).not.toHaveBeenCalled();
    expect(renders).toBe(1);
  });

  it("falls back to the appearance a system has", () => {
    const lightOnly = system({ "identity.modes": "light" });
    expect(chromeFor(lightOnly, "dark").variant.appearance).toBe("light");
    const darkOnly = system({ "identity.modes": "dark" });
    expect(chromeFor(darkOnly, "light").variant.appearance).toBe("dark");
    const hc = system({ "color.highContrast": true });
    expect(chromeFor(hc, "dark").variant).toBe(auroraVariantFor(hc, "dark"));
  });
});

describe("one @aurora/core", () => {
  it("renders a @tokenseed/aurora theme through @aurora/react", () => {
    const sys = SYSTEMS[1]!;
    const variant = toAuroraTheme(sys).variants.get("light")!;
    let seen = "";
    function Probe() {
      seen = useAuroraTokens().primary.hex;
      return null;
    }
    render(
      <AuroraFixedScope variant={variant} texture={auroraTextureFor(sys)}>
        <Probe />
      </AuroraFixedScope>,
    );
    expect(seen).toBe(variant.read([...variant.values.keys()].find((t) => t.path === "colors.primary")!).hex);
  });
});

describe("gallery", () => {
  it("gives each of 40 scopes its own system's colours", () => {
    const { container } = render(
      <div>
        {Array.from({ length: 40 }, (_, i) => {
          const { variant, texture } = chromeFor(SYSTEMS[i % 4]!, "light");
          const scope = (
            <AuroraFixedScope key={i} className="g" variant={variant} texture={texture}>
              card {i}
            </AuroraFixedScope>
          );
          // Every fifth card nests inside another system's scope to prove the inner one wins.
          if (i % 5 !== 0) return scope;
          const outer = chromeFor(SYSTEMS[(i + 1) % 4]!, "light");
          return (
            <AuroraFixedScope key={i} variant={outer.variant} texture={outer.texture}>
              {scope}
            </AuroraFixedScope>
          );
        })}
      </div>,
    );
    const els = [...container.querySelectorAll<HTMLElement>(".g")];
    expect(els).toHaveLength(40);
    els.forEach((el, i) => {
      const expected = vars(SYSTEMS[i % 4]!)["--aurora-colors-primary"];
      expect(el.style.getPropertyValue("--aurora-colors-primary")).toBe(expected);
    });
    expect(new Set(els.map((e) => e.style.getPropertyValue("--aurora-colors-primary"))).size).toBe(4);
  });
});
