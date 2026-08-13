import test from 'node:test';import assert from 'node:assert/strict';import {loadSeoRoutes} from '../scripts/seo-routes.mjs';
test('support route is included in SEO inventory',async()=>{const route=(await loadSeoRoutes()).find(({path})=>path==='/support');assert.ok(route);assert.equal(route.canonical,'https://lekeopen.com/support/');});
