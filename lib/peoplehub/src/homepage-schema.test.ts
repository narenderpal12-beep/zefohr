import assert from 'node:assert/strict';
import { test } from 'node:test';
import { homepageSettingsSchema } from './homepage-schema';
import { normalizeHomepageDesign, resolveHomepageDesign, HOMEPAGE_DESIGNS } from '../../../artifacts/peoplehub/src/lib/homepage-designs';

test('all three homepage choices validate and stay available', () => {
  assert.equal(HOMEPAGE_DESIGNS.length, 3);
  for (const { id } of HOMEPAGE_DESIGNS) {
    assert(homepageSettingsSchema.safeParse({ activeVariant: id }).success);
    assert.equal(resolveHomepageDesign(id), id);
  }
  assert(!homepageSettingsSchema.safeParse({ activeVariant: 'missing' }).success);
  assert(!homepageSettingsSchema.safeParse({}).success);
});

test('preview is visit-only and never changes a saved setting', () => {
  const saved = { activeVariant: 'alternate', otherSetting: 'retain me' };
  assert.equal(resolveHomepageDesign(saved.activeVariant, '?homePreview=creative'), 'creative');
  assert.equal(resolveHomepageDesign(saved.activeVariant), 'alternate');
  assert.equal(saved.activeVariant, 'alternate');
  assert.equal(resolveHomepageDesign(saved.activeVariant, '?homePreview=unknown'), 'alternate');
  assert.equal(resolveHomepageDesign('creative', '?other=value'), 'creative');
});

test('invalid legacy choices fall back safely and unrelated settings survive validation', () => {
  assert.equal(normalizeHomepageDesign(undefined), 'original');
  assert.equal(normalizeHomepageDesign('unknown'), 'original');
  assert.deepEqual(homepageSettingsSchema.parse({ activeVariant: 'creative', otherSetting: 'retain me' }), { activeVariant: 'creative', otherSetting: 'retain me' });
});
