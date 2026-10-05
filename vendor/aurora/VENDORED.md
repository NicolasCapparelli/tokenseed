# Vendored Aurora (TypeScript)

App-owned snapshot exported by Aurora tools/vendor.py --typescript. Commit this entire directory.
core/ is @aurora/core and react/ is @aurora/react, as built ESM with type declarations.
Do not edit files here; update from Aurora with the exporter and --replace.
Depend on both from the app's package.json with file: specifiers:
  "@aurora/core": "file:vendor/aurora/core"
  "@aurora/react": "file:vendor/aurora/react"
@aurora/react takes @aurora/core and react as peer dependencies, so the app's one copy is used.
vendor-manifest.json records source HEAD, working-tree state, versions, toolchain and SHA-256 files.
