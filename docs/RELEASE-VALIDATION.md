# Release validation / 发布验证

Date: 2026-09-30. Platform: macOS. Host: DeepSeek Harness 0.2.0-rc.2.

## Build and package

`npm ci`, `npm run check` and `npm pack` passed. The prepack guard checks package exports, bundle patch, README, license and screenshot paths. Home: 21 tests. Reader: 47 tests. RSS: all seven test scripts passed. Counts refer to the corresponding repository only.

## Isolated host

Installed the built tarball into a fresh Web profile with a separate DSH_HOME, without a development-directory symlink. Started the full host and exercised the visible plugin:

RSS: loaded a public channel and article, selected an existing rewritten version, opened subscription discovery.

Screenshots were captured from this environment. No model key was configured; live AI inference was not verified in this pass. Other operating systems, mobile devices, all real-world files and long-running behavior are outside this verification.

## Distribution

PR checks and merge are visible on GitHub. Releases include a prebuilt tarball and SHA256 file. Public download and reinstall evidence is recorded in the Release notes after publication. Topics and prepared marketplace metadata do not mean marketplace acceptance. No marketplace submission or npm publication is claimed.
