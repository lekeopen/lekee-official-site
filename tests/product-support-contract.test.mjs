import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCT_OPTIONS, SYSTEM_OPTIONS, ISSUE_TYPE_OPTIONS } from '../src/support/config.js';
import { createSupportReference } from '../functions/support/reference.mjs';

test('support option values are unique and products are stable', () => {
  assert.deepEqual(PRODUCT_OPTIONS.map(({ value }) => value), ['leke-picker', 'guigelei', 'other']);
  for (const options of [PRODUCT_OPTIONS, SYSTEM_OPTIONS, ISSUE_TYPE_OPTIONS]) {
    assert.equal(new Set(options.map(({ value }) => value)).size, options.length);
  }
});

test('support reference contains date and random data only', () => {
  const reference = createSupportReference(new Date('2026-08-13T10:00:00Z'), new Uint8Array([1, 35, 69, 103]));
  assert.equal(reference, 'LK-20260813-01234567');
});
