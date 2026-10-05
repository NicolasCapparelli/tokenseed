import { createSeed, type KnobValue, type Seed } from "@tokenseed/core";
import { useCallback, useEffect, useState } from "react";

export type Level = "sprout" | "grow" | "craft";

const KEY = "tokenseed.v0.seed";

const starter = () =>
  createSeed(
    { "identity.name": "My system", "color.primary": "#3b5bdb", "identity.productType": "saas", "identity.modes": "both" },
    { random: Math.floor(Math.random() * 100000) },
  );

function load(): Seed {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Seed;
  } catch {
    // Storage can be unavailable (private mode); start fresh.
  }
  return starter();
}

/** The seed is the whole document for now. Snapshots and repos arrive with storage. */
export function useSeed() {
  const [seed, setSeed] = useState<Seed>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(seed));
    } catch {
      // Not fatal: the session just won't persist.
    }
  }, [seed]);

  const setKnob = useCallback((id: string, value: KnobValue | undefined) => {
    setSeed((s) => {
      const knobs = { ...s.knobs };
      if (value === undefined) delete knobs[id];
      else knobs[id] = value;
      return { ...s, knobs };
    });
  }, []);

  const setTrait = useCallback((id: string, value: number | undefined) => {
    setSeed((s) => {
      const traits = { ...s.traits };
      if (value === undefined) delete traits[id];
      else traits[id] = value;
      return { ...s, traits };
    });
  }, []);

  const toggleLock = useCallback((id: string) => {
    setSeed((s) => ({ ...s, locks: s.locks.includes(id) ? s.locks.filter((l) => l !== id) : [...s.locks, id] }));
  }, []);

  const togglePreset = useCallback((id: string) => {
    setSeed((s) => ({ ...s, presets: s.presets.includes(id) ? s.presets.filter((p) => p !== id) : [...s.presets, id] }));
  }, []);

  const reset = useCallback(() => setSeed(starter()), []);

  return { seed, setSeed, setKnob, setTrait, toggleLock, togglePreset, reset };
}
