/*
 * The brand, in one place.
 *
 * The product was OwnAI until 27 October 2026 and is OwnSect now. To rename
 * the site:
 *   1. edit the values below
 *   2. the social card carries the logo in the picture (public/social/card.jpg,
 *      made by the video app in the main repository, which this project does
 *      not have); its lockup was redrawn with the wordmark on 29 October 2026,
 *      and a new logo means rendering it again
 *   3. npm run build
 * Every page title, meta tag, structured-data block, the manifest, the
 * sitemap and the visible copy follow. The films carry no name, so they need
 * no re-render; the one place the old name appeared in the recording (the
 * assistant's sidebar header) is painted out in every render.
 *
 * The logo is the one thing a rename does not follow: it is a picture of the
 * name. Trace the new logo with tools/wordmark.mjs, which writes wordmark.ts.
 */
import { WORDMARK } from './wordmark.ts';

export const BRAND = {
  /** the name as it is written in running text */
  name: 'OwnSect',
  /** what it is, in two or three words: search results, the social card, the kicker */
  descriptor: 'Private AI workroom',
  /** the one sentence the home page leads with, and the social card's headline */
  tagline: 'The workroom that stays inside your network.',
  /** the line under the name in search results and link previews */
  summary:
    'A private AI workroom for your company: documents, assistant, projects, time and clients, on hardware you control.',
  /** where the site is served, no trailing slash: canonical URLs, the sitemap, the social card */
  url: 'https://ownsect.example',
  /** the address on the contact page and in structured data */
  email: 'hello@ownsect.example',
  /** where "Log in" goes: the product itself */
  appUrl: 'https://app.ownsect.example',
  /** the copyright line */
  legalName: 'OwnSect',
  /**
   * The logo: the name as one filled path, drawn in the nav and set huge in
   * the band at the foot of every page, in whatever colour is around it.
   */
  wordmark: WORDMARK,
  /**
   * The mark, as an SVG path on a 24-unit grid, stroked: the favicon, the app
   * icons and the social card, where the whole word would be too small to
   * read. A ring: the shape of the page itself.
   */
  markPath: 'M12 5.8a6.2 6.2 0 1 0 0 12.4a6.2 6.2 0 1 0 0-12.4z',
  /**
   * The 3D mark at the still centre of the ring: a glTF file under public/,
   * by its path from the site's root (e.g. 'brand/os.glb'). Empty, the
   * chrome ring stands in for it. Whatever the file's own materials, every
   * mesh is given the chrome; it is centred on its own bounds and sized to
   * the ring's centre, and it sways rather than spins, so a word stays
   * readable (src/scene/centrepiece.ts).
   */
  mark3d: '' as string,
  /**
   * The company's profiles elsewhere, in the order the footer lists them;
   * empty until there are some. They also go into the structured data as
   * the company's other identities, and an X handle into link previews.
   * E.g. { name: 'LinkedIn', url: 'https://www.linkedin.com/company/...' },
   *      { name: 'X', url: 'https://x.com/...', handle: '@...' }
   */
  social: [] as readonly { name: string; url: string; handle?: string }[],
} as const;

export type Brand = typeof BRAND;
