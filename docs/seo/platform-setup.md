# Webmaster Platform Setup

This site exposes optional ownership proof during the production build. The
values are public verification material: their purpose is to be visible to a
webmaster platform and they must not be confused with submission credentials.

## Cloudflare build configuration

In Cloudflare Pages, add the following production build variables only after
obtaining each provider's verification value:

| Variable | Purpose | Build output |
| --- | --- | --- |
| `BAIDU_SITE_VERIFICATION` | Baidu HTML meta verification value | `baidu-site-verification` meta tag on every prerendered page |
| `GOOGLE_SITE_VERIFICATION` | Google Search Console HTML meta verification value | `google-site-verification` meta tag on every prerendered page |
| `BING_SITE_VERIFICATION` | Bing Webmaster Tools HTML meta verification value | `msvalidate.01` meta tag on every prerendered page |
| `INDEXNOW_KEY` | IndexNow ownership key | `/<INDEXNOW_KEY>.txt` at the deployed site root, containing exactly the key in UTF-8 |

Leave a variable unset when that platform uses DNS verification instead. Empty
values produce no meta tag. Verification values containing control characters
are rejected during the build; `INDEXNOW_KEY` must be 8–128 ASCII letters,
numbers, or hyphens.

When `INDEXNOW_KEY_LOCATION` is supplied to the operations command, it must be
an absolute HTTPS URL without credentials, query parameters, or a fragment. It
must use the same production origin as every submitted URL. Per the IndexNow
path-scope rule, only URLs below the key file's directory are authorized. The
root file `https://lekeopen.com/<INDEXNOW_KEY>.txt` therefore covers the full
current inventory; a key under `/news/` cannot authorize `/projects/` or `/`.

`BAIDU_SUBMIT_TOKEN` is different: it authorizes URL-submission requests and
is private. Do not put it in the public build configuration or expose it in
client code, documentation examples, screenshots, logs, or tickets. Store it
only in the controlled operations environment that runs Baidu submission.

## Ownership checkpoints

1. Choose one ownership method in each provider console. For HTML-meta
   verification, configure the matching Cloudflare variable and deploy. For
   DNS verification, add the exact DNS record in the authoritative DNS
   provider and leave the corresponding meta variable unset.
2. Confirm the deployed proof before clicking Verify: view the page source for
   a meta method, or resolve the DNS record for a DNS method. For IndexNow,
   request `https://lekeopen.com/<INDEXNOW_KEY>.txt` and confirm its response
   is exactly the configured key.
3. Add or confirm the sitemap URL in Baidu Search Resource Platform, Google
   Search Console, and Bing Webmaster Tools:
   `https://lekeopen.com/sitemap.xml`.
4. Record the platform, ownership method, deployment timestamp, sitemap
   submission timestamp, and accepted/pending status without recording secret
   submission tokens.

The Baidu URL submission endpoint accepts at most 2,000 URLs per request. The
current inventory contains 26 canonical URLs, so V1.4 intentionally defers
batching. Stop real submissions and implement tested batching before the
inventory reaches that protocol limit.

## Human-operated pauses

Pause and hand control to the site owner when a provider requires login,
multi-factor authentication, CAPTCHA, DNS-account access, a verification
button, or confirmation of sitemap submission. The operator must complete
those actions in the provider or DNS console and confirm the resulting status
before any follow-up indexing operation proceeds.
