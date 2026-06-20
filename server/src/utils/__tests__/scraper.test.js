import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrapeMetadata } from '../scraper.js';

// Bouwt een nep-Response object zoals fetch() die zou teruggeven,
// inclusief een ReadableStream body (zoals scraper.js die verwacht).
function makeFakeResponse({ html, status = 200, contentType = 'text/html' }) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(html);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key) => (key.toLowerCase() === 'content-type' ? contentType : null),
    },
    body: {
      getReader: () => {
        let sent = false;
        return {
          read: async () => {
            if (sent) return { done: true, value: undefined };
            sent = true;
            return { done: false, value: bytes };
          },
          cancel: () => {},
        };
      },
    },
  };
}

describe('scrapeMetadata', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('extraheert og:title, og:description en og:image', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeFakeResponse({
        html: `
          <html><head>
            <meta property="og:title" content="Mooie Titel">
            <meta property="og:description" content="Een test beschrijving">
            <meta property="og:image" content="https://example.com/foto.png">
          </head></html>
        `,
      })
    );

    const result = await scrapeMetadata('https://example.com');
    expect(result.title).toBe('Mooie Titel');
    expect(result.description).toBe('Een test beschrijving');
    expect(result.imageUrl).toBe('https://example.com/foto.png');
  });

  it('valt terug op <title> als og:title ontbreekt', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeFakeResponse({ html: '<html><head><title>Gewone Titel</title></head></html>' })
    );

    const result = await scrapeMetadata('https://example.com');
    expect(result.title).toBe('Gewone Titel');
  });

  it('zet relatieve image-URLs om naar absolute URLs', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeFakeResponse({
        html: '<html><head><meta property="og:image" content="/images/foto.png"></head></html>',
      })
    );

    const result = await scrapeMetadata('https://example.com');
    expect(result.imageUrl).toBe('https://example.com/images/foto.png');
  });

  it('voegt https:// toe als de URL geen protocol heeft', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeFakeResponse({ html: '<html><head><title>Test</title></head></html>' })
    );

    const result = await scrapeMetadata('example.com');
    expect(result.url).toBe('https://example.com');
  });

  it('gooit een fout als de response niet ok is', async () => {
    global.fetch = vi.fn().mockResolvedValue(makeFakeResponse({ html: '', status: 404 }));

    await expect(scrapeMetadata('https://example.com/niet-bestaand')).rejects.toThrow();
  });

  it('gooit een fout als de content-type geen HTML is', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeFakeResponse({ html: '', contentType: 'application/pdf' })
    );

    await expect(scrapeMetadata('https://example.com/document.pdf')).rejects.toThrow();
  });

  it('kapt de titel af op 500 tekens', async () => {
    const longTitle = 'A'.repeat(600);
    global.fetch = vi.fn().mockResolvedValue(
      makeFakeResponse({ html: `<html><head><title>${longTitle}</title></head></html>` })
    );

    const result = await scrapeMetadata('https://example.com');
    expect(result.title.length).toBe(500);
  });
});
