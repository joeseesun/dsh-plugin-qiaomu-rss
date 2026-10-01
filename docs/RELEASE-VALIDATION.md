# Release validation / 发布验证

Date: 2026-10-01. Platform: macOS. Host: DeepSeek Harness 0.2.0-rc.2.

## Build and package

`npm run check` validates the build, eleven test scripts and the package guard. Tests cover selection scope, preserving drafts, serial context binding, quote removal, custom prompt scope, transcript errors and media player boundaries. `npm pack` produces a prebuilt bundle with exports, patch, README and licenses.

## Installed Desktop

The development bundle was reloaded in Desktop. Selected an English paragraph, checked the quote inside the native composer and sent “翻译”. The response translated only the selected paragraph. Removing the quote restored article scope. Existing reading data was preserved. A separate host test with the installed Cordis dependencies verified per-session context, scope reset and persistence.

## Distribution

The Release includes a prebuilt tarball and SHA256 file. Public asset download and isolated installation are verified during publication and recorded in the Release notes. Reading and discovery screenshots are from the previous isolated Web profile validation, not a new v0.6.0 screenshot session. Topics enable official community discovery; community-directory submission and maintainer acceptance are separate. No npm publication or DeepSeek endorsement is claimed.

Podcast and video tests cover parsing, errors and playback infrastructure. They do not establish availability of every upstream program or playback permission for every video. Other operating systems and mobile devices were not tested.

## v0.7.0 link collection

See [v0.7.0 verification](RELEASE-0.7.0.md) for the isolated installed Harness flow, genuine submission/restart/result evidence, privacy boundary and remaining platform limitations.
