import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPassword, isPlausibleUrl, sanitizeTags } from '../validation.js';

describe('isValidEmail', () => {
  it('accepteert een normaal e-mailadres', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('weigert een string zonder @', () => {
    expect(isValidEmail('niet-een-email')).toBe(false);
  });

  it('weigert een lege string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('weigert undefined of null', () => {
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });

  it('weigert een e-mailadres zonder domeinextensie', () => {
    expect(isValidEmail('test@localhost')).toBe(false);
  });

  it('weigert een buitensporig lang e-mailadres', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    expect(isValidEmail(longEmail)).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('weigert een wachtwoord korter dan 6 tekens', () => {
    expect(isValidPassword('12345')).toBe(false);
  });

  it('accepteert een wachtwoord van precies 6 tekens', () => {
    expect(isValidPassword('123456')).toBe(true);
  });

  it('weigert een buitensporig lang wachtwoord', () => {
    expect(isValidPassword('a'.repeat(201))).toBe(false);
  });
});

describe('isPlausibleUrl', () => {
  it('accepteert een volledige URL met protocol', () => {
    expect(isPlausibleUrl('https://example.com')).toBe(true);
  });

  it('accepteert een URL zonder protocol (scraper voegt https:// later toe)', () => {
    expect(isPlausibleUrl('example.com')).toBe(true);
  });

  it('weigert een lege string', () => {
    expect(isPlausibleUrl('')).toBe(false);
  });

  it('weigert tekst zonder punt in de hostnaam', () => {
    expect(isPlausibleUrl('niet-een-url')).toBe(false);
  });

  it('weigert een buitensporig lange string', () => {
    expect(isPlausibleUrl('https://example.com/' + 'a'.repeat(3000))).toBe(false);
  });
});

describe('sanitizeTags', () => {
  it('trimt whitespace van elke tag', () => {
    expect(sanitizeTags(['  voetbal  '])).toEqual(['voetbal']);
  });

  it('filtert lege tags eruit', () => {
    expect(sanitizeTags(['voetbal', '', '   '])).toEqual(['voetbal']);
  });

  it('filtert niet-string waarden eruit', () => {
    expect(sanitizeTags(['voetbal', 123, null, undefined])).toEqual(['voetbal']);
  });

  it('beperkt het aantal tags tot 20', () => {
    const manyTags = Array.from({ length: 30 }, (_, i) => `tag${i}`);
    expect(sanitizeTags(manyTags)).toHaveLength(20);
  });

  it('geeft een lege array terug als input geen array is', () => {
    expect(sanitizeTags('niet-een-array')).toEqual([]);
    expect(sanitizeTags(null)).toEqual([]);
    expect(sanitizeTags(undefined)).toEqual([]);
  });
});
