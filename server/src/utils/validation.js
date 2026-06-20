// Centrale validatie-functies, zodat elke controller dezelfde regels
// gebruikt in plaats van losse, mogelijk inconsistente checks.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim()) && email.length <= 255;
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6 && password.length <= 200;
}

// Checkt of een string een geldige, fetch-bare URL kan zijn. We zijn hier
// expres soepel (accepteren ook "example.com" zonder protocol, want de
// scraper voegt zelf https:// toe) — dit is een sanity-check, geen strikte
// RFC-validatie. Het doel is vooral evidente onzin (lege string, spaties,
// duizenden tekens) eruit filteren vóórdat we een netwerk-request doen.
function isPlausibleUrl(input) {
  if (typeof input !== 'string') return false;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) return false;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    // Moet tenminste iets als "iets.iets" zijn (een punt in de hostnaam)
    return url.hostname.includes('.');
  } catch {
    return false;
  }
}

// Tags: elke losse tag mag niet leeg of absurd lang zijn, en we limiteren
// het totale aantal — voorkomt dat iemand per ongeluk (of expres) honderden
// tags aan één bookmark hangt.
function sanitizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t) => typeof t === 'string')
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= 50)
    .slice(0, 20);
}

module.exports = { isValidEmail, isValidPassword, isPlausibleUrl, sanitizeTags };
