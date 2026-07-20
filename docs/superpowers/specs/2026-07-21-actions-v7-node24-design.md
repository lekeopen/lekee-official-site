# V1.1.1 GitHub Actions Runtime Upgrade Design

## Goal

Remove the GitHub Actions Node.js 20 runtime deprecation warning and align CI with the Node.js 24 environment used for local verification.

## Scope

- Upgrade `actions/checkout` from major version 4 to major version 7.
- Upgrade `actions/setup-node` from major version 4 to major version 7.
- Change the workflow test runtime from Node.js 20 to Node.js 24.
- Record the V1.1.1 maintenance release.

No application code, content, dependencies, build scripts, deployment settings, or production behavior will change.

## Compatibility and Risk

GitHub-hosted `ubuntu-latest` runners satisfy the current runner requirements of the v7 actions. The project already passes its full quality gate on Node.js 24 locally, so the runtime change aligns CI with a verified environment.

The primary risk is workflow startup incompatibility. It is contained by releasing through `develop` first: the branch must complete `npm ci` and `npm run verify` before the same commit can advance to `main`.

## Validation and Release

1. Validate the edited workflow structure and inspect the exact diff.
2. Run `npm run verify` locally on Node.js 24.
3. Push the maintenance commit to `develop` and require the `quality` workflow to pass without the Node.js 20 action-runtime warning.
4. Fast-forward `main`, push it, and require the production-branch `quality` workflow to pass.
5. Confirm the production site and RSS endpoint remain available.

## Rollback

If either branch workflow fails because of the action upgrade, revert the maintenance commit. Since the change is isolated to CI configuration and release notes, rollback has no application or data migration impact.
