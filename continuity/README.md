# TokenSeed continuity

Updated 2026-10-07. Start here; [the handoff](../docs/handoff.md) contains the detailed UI implementation plan and accepted decisions.

## Current state

TokenSeed has a working framework-free TypeScript generation engine and a functional React editor. The approved Studio concept has not yet been implemented.

- Engine: 172 knobs across 18 groups, 12 traits, 12 presets, deterministic seeds, variations, light/dark/high-contrast tokens, WCAG/APCA checks, and CSS, Tailwind v4, DTCG and DESIGN.md exporters.
- System history: content-hashed snapshots, branches, tags, restore, fork, seed/token diffs, IndexedDB storage and portable `.tokenseed` bundles.
- Aurora: vendored TypeScript core/React packages, foundation color/texture mapping, live editor theming, independently themed library cards and validated Flutter bundle export. TokenSeed keeps its own generator.
- UI: the existing editor works, but its controls, specimen, versions, library and export interface still need the approved redesign.

## Repository baseline

- The sole development/default branch is `master` (formerly `main`).
- PRs #1 (core engine) and #2 (catalog/snapshots) were already merged.
- The six completed commits on `claude/project-thread-5gq6qj`, ending at `b5adabc`, were fast-forwarded into the baseline after validation.
- The superseded feature branches were removed locally and remotely after their commits were confirmed reachable from the baseline.
- Local-only launch configuration and model-usage tooling/data were preserved under `.local/cleanup-2026-10-07/` with their original relative paths. The launch configuration also remains active at `.claude/launch.json`. These files are intentionally ignored and not published. The archive also holds the verified `pre-cleanup.bundle`, including the prior refs and old stash. The superseded stash remains in Git because automatic approval review rejected its deletion as outside the branch-cleanup authorization; it does not dirty the working tree.
- The normal root scripts now invoke pinned pnpm through Corepack, avoiding a conflicting global pnpm installation. Git's unavailable filesystem monitor is disabled locally.

## Validation

The Aurora branch passed all 80 tests (39 engine, 37 bridge, 4 web), workspace TypeScript checks and the production web build. The repaired root commands also passed: `corepack pnpm test`, `corepack pnpm typecheck`, `corepack pnpm build`. Install with `corepack pnpm install --frozen-lockfile`; start with `corepack pnpm dev`.

Aurora contrast diagnostics are informational: many dark variants have secondary text at approximately 4.30-4.37:1 against bright/high container surfaces, below the 4.5 target. Bundle validation passes; this contrast issue remains open. The current automated web tests cover the Aurora adapter, not complete editor interactions or visual fidelity.

## Outstanding work, in suggested order

1. **Dark-mode contrast.** Adjust the TokenSeed-to-Aurora secondary-text mapping or relevant surfaces and add an enforced regression check for the affected pairs. Keep light mode and bundle validity intact.
2. **Approved Start and Studio shell.** Implement onboarding with a color and product choice, the preview-first Studio layout, depth switch and glass controls on Aurora. Reuse `state.ts` and `storage.ts`. See [the concept](../docs/concept/tokenseed-concept.html) and [design direction](../docs/design-brief.md).
3. **Simple controls with depth on demand.** Map 18 catalog groups into 8 friendly areas, designate featured knobs, add area summaries and visual choice tiles, and implement Sprout/Grow/Craft panels. Sprout and Grow should expose about 12 controls at most; traits can remain open until chosen.
4. **Preview and exploration.** Add App, Landing, Mobile and Tokens specimen templates, the floating pick strip and compact previews generated from real tokens.
5. **Versions, export and library redesign.** Add token-rendered version thumbnails and draggable before/after comparison, the export drawer with format cards/code preview, and library posters with overflow actions. The underlying history, exporters and storage already exist.
6. **Integration polish.** Exercise persistence/import/export, mode switching, keyboard accessibility, responsiveness and the complete editor flow. Validate the redesigned screens against the concept.

The optional AI vibe field needs an explicit product decision before implementation. Do not replace TokenSeed's generator with Aurora or publish the private packages without a new decision.

Items 2-5 are the remaining steps 4-7 in the original handoff. No unfinished implementation branch is being discarded; these are planned work.
