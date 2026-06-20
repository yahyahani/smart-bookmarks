const cheerio = require('cheerio');

const MAX_HTML_SIZE = 3 * 1024 * 1024; // 3MB — ruim genoeg voor de <head> van zelfs zware pagina's

// Haalt de HTML van een URL op en extraheert title, description, image en favicon.
// We gebruiken Open Graph tags (og:title, og:description, og:image) waar mogelijk,
// omdat de meeste moderne websites die invullen voor een mooie preview (zoals
// wanneer je een link deelt op Twitter of WhatsApp). Als die ontbreken, vallen we
// terug op de standaard <title> en <meta name="description">.
async function scrapeMetadata(url) {
  // Voeg https:// toe als de gebruiker geen protocol heeft ingevuld
  let targetUrl = url.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  const response = await fetch(targetUrl, {
    headers: {
      // Sommige sites blokkeren requests zonder een "echte" browser User-Agent
      'User-Agent': 'Mozilla/5.0 (compatible; SmartBookmarksBot/1.0)',
    },
    // Voorkom dat een trage of vastgelopen site de hele request laat hangen
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Kon de pagina niet ophalen (status ${response.status})`);
  }

  // Als de link naar een PDF, afbeelding, video, etc. wijst, heeft cheerio
  // niets te parsen — beter dat meteen te detecteren dan brei te krijgen.
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    throw new Error(`Geen HTML-pagina (content-type: ${contentType || 'onbekend'})`);
  }

  // Lees de body met een harde grootte-limiet, zodat een enorme of
  // kwaadaardige response niet onbeperkt geheugen kan opslokken.
  const reader = response.body.getReader();
  let received = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    if (received > MAX_HTML_SIZE) {
      reader.cancel();
      throw new Error('Pagina is te groot om te verwerken');
    }
    chunks.push(value);
  }
  const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf-8');

  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text() ||
    targetUrl;

  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    null;

  let imageUrl = $('meta[property="og:image"]').attr('content') || null;

  // Relatieve image-URLs (bv. "/images/foto.png") omzetten naar absolute URLs
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    try {
      imageUrl = new URL(imageUrl, targetUrl).href;
    } catch {
      imageUrl = null; // een kapotte relatieve URL mag de hele scrape niet laten falen
    }
  }

  // Favicon: meestal te vinden via een <link rel="icon">, anders gokken we op /favicon.ico
  let faviconUrl =
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    '/favicon.ico';

  if (faviconUrl && !/^https?:\/\//i.test(faviconUrl)) {
    try {
      faviconUrl = new URL(faviconUrl, targetUrl).href;
    } catch {
      faviconUrl = null;
    }
  }

  return {
    url: targetUrl,
    title: title.trim().slice(0, 500), // niet langer dan de kolombreedte in de database
    description: description ? description.trim().slice(0, 2000) : null,
    imageUrl,
    faviconUrl,
  };
}

module.exports = { scrapeMetadata };
