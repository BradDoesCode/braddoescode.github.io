// Shared by cv-pdf.mjs (the public PDF, made on every build) and cv-private.mjs
// (Brad's private copy, never published). Renders the built /cv/ page through
// its print stylesheet with headless Chrome (puppeteer, already installed for
// pa11y-ci) and returns the PDF bytes. Everything is served from a local
// server on 127.0.0.1, so it runs offline and the page's own CSP applies.
import puppeteer from 'puppeteer';
import { startServer } from './serve.mjs';

export const CV_TITLE = 'Bradley Barbrook – CV';
export const CV_AUTHOR = 'Bradley Barbrook';

/**
 * @param {string} dist  the built site, containing cv/index.html
 * @param {(page: import('puppeteer').Page) => Promise<void>} [prepare]
 *        runs on the loaded page just before printing (used by the private copy)
 * @returns {Promise<Buffer>}
 */
export async function renderCvPdf(dist, prepare) {
  const server = await startServer(dist);
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const response = await page.goto(`${server.origin}/cv/`, { waitUntil: 'networkidle0' });
    if (!response || !response.ok()) {
      throw new Error(`could not load /cv/ from ${dist} (status ${response?.status()})`);
    }
    await page.evaluate(() => document.fonts.ready.then(() => true));
    await page.evaluate((title) => {
      document.title = title;
    }, CV_TITLE);
    if (prepare) await prepare(page);
    await page.emulateMediaType('print');
    const bytes = await page.pdf({
      format: 'A4',
      printBackground: false,
      preferCSSPageSize: true,
    });
    return setAuthor(Buffer.from(bytes), CV_AUTHOR);
  } finally {
    await browser.close();
    await server.close();
  }
}

/**
 * Chrome cannot set a PDF's author, so add one with an incremental update:
 * the original bytes stay untouched and a new copy of the Info dictionary,
 * the cross-reference entry and trailer are appended. Throws if the file is
 * not shaped the way Chrome writes it, so a change in Chrome fails loudly.
 */
export function setAuthor(pdf, author) {
  const text = pdf.toString('latin1');
  const startxref = [...text.matchAll(/startxref\s+(\d+)\s+%%EOF\s*$/g)].at(-1);
  if (!startxref) throw new Error('PDF has no startxref');
  const prev = Number(startxref[1]);
  const trailer = text.slice(prev).match(/trailer\s*<<([\s\S]*?)>>\s*startxref/);
  if (!trailer) throw new Error('PDF has no classic trailer to extend');
  const info = trailer[1].match(/\/Info\s+(\d+)\s+(\d+)\s+R/);
  const size = trailer[1].match(/\/Size\s+(\d+)/);
  const root = trailer[1].match(/\/Root\s+\d+\s+\d+\s+R/);
  if (!info || !size || !root) throw new Error('PDF trailer lacks Info, Size or Root');
  const objectNumber = Number(info[1]);
  const oldInfo = text.match(new RegExp(`(?:^|\\s)${objectNumber} 0 obj\\s*<<([\\s\\S]*?)>>\\s*endobj`));
  if (!oldInfo) throw new Error('PDF Info object not found');
  const hex = (s) => 'FEFF' + Buffer.from(s, 'utf16le').swap16().toString('hex').toUpperCase();
  // Keep the producer and dates Chrome wrote. Title and author are set here,
  // and the creator (a full user-agent string) is shortened to "Chromium".
  const string = String.raw`(?:\((?:[^()\\]|\\.)*\)|<[^>]*>)`;
  const kept = oldInfo[1].replace(new RegExp(String.raw`\/(?:Title|Author|Creator)\s*${string}`, 'g'), '');
  const infoObject = `${objectNumber} 0 obj\n<< /Title <${hex(CV_TITLE)}> /Author <${hex(author)}> /Creator (Chromium) ${kept.trim()} >>\nendobj\n`;
  const body = pdf.toString('latin1').replace(/\s*$/, '\n');
  const infoOffset = Buffer.byteLength(body, 'latin1');
  const xrefOffset = infoOffset + Buffer.byteLength(infoObject, 'latin1');
  const id = trailer[1].match(/\/ID\s*\[[^\]]*\]/)?.[0] ?? '';
  const tail =
    `xref\n${objectNumber} 1\n${String(infoOffset).padStart(10, '0')} 00000 n \n` +
    `trailer\n<< /Size ${size[1]} ${root[0]} /Info ${objectNumber} 0 R ${id} /Prev ${prev} >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(body + infoObject + tail, 'latin1');
}
