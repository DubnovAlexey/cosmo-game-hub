// The five interface languages: a saved choice wins, then the browser languages, then English.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES, directionOf, pickLanguage } from '../i18n/languages.ts';

test('five languages under their own names; only Hebrew is right-to-left', () => {
  assert.deepEqual(LANGUAGES.map(language => language.code), ['ru', 'en', 'he', 'es', 'fr']);
  assert.deepEqual(LANGUAGES.filter(language => directionOf(language.code) === 'rtl').map(language => language.code), ['he']);
});

test('the language is the saved choice, else the first browser language we speak, else English', () => {
  assert.equal(pickLanguage({ saved: 'fr', browser: ['ru-IL'] }), 'fr');
  assert.equal(pickLanguage({ saved: 'xx', browser: ['de-DE', 'ru-IL', 'en'] }), 'ru');
  assert.equal(pickLanguage({ browser: ['iw-IL'] }), 'he', 'the old code for Hebrew');
  assert.equal(pickLanguage({ browser: ['de', 'it'] }), 'en');
  assert.equal(pickLanguage({}), 'en');
});
