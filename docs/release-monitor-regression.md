# Release monitor regression checks

The website consumes verified public GitHub releases. Product/catalog and rendered-page tests must validate the current release data rather than pinning the latest version or the number of historical releases.

- Catalog tests import the actual Store-channel module; explicit fixtures cover matching, lagging and malformed versions. Store approval is not inferred from a GitHub release.
- History checks require a unique, latest-first catalog of at most ten releases and render the first three entries.
- Before promotion, run the release monitor and verified web importer in an isolated checkout, then `npm run verify`. This checks the updated data and rendered HTML together.
- Keep the OSS bucket private. This regression fix does not change download credentials, Bucket ACLs, DNS or CDN configuration.

Rollback: revert the test-only change through review. Do not roll back release assets or restore the old public OSS URLs. A reverted test may block future automatic updates again, so inspect the monitor failure before retrying.
