# ownsect

The OwnSect landing page, on its own: everything needed to work on it, build
it and serve it, with nothing from the rest of the repository. (The product
was called OwnAI until 27 October 2026; `content/src/brand.ts` holds the name.)

```
index.html          the page
src/                scripts, styles, the ring (three.js)
build/              the build's own plugins: prerendered pages, panels, the local demo inbox
content/            the words, prices, workflows and links (was packages/content)
public/             films, posters, icons, social card, robots and sitemap
tools/              one-off generators (fonts, grain, the ring's first-frame image, the wordmark)
```

## Run it

Node 20.19 or later (or 22.12 and later), as Vite 8 needs.

```
npm install
npm run dev        # http://localhost:5173
npm run build      # checks the content, type-checks, writes dist/
npm run preview    # serves dist/ as a host would, http://localhost:4173
```

`dist/` is the whole site: upload it to any static host.

The films and posters in `public/video/` were rendered from the screen
recording by the video app in the main repository (`apps/video`); they are
copied here as finished files, so nothing needs re-rendering to build.

## The logo

The nav and the band at the foot of every page draw the OwnSect wordmark as
one filled path, in whatever colour is around them, in both themes. It is
traced from the logo picture (`tools/brand/ownsect-logo.webp`) into
`content/src/wordmark.ts`:

```
npm i --no-save potrace@2.1.8      # and ImageMagick's convert
node tools/wordmark.mjs
```

Run as it stands, the tracer writes that file byte for byte. With a vector
original of the logo, use its path there instead: tracing is the next best
thing. The favicon and app icons keep the ring mark (`BRAND.markPath`), where
the whole word would be too small to read.

## The 3D mark

The chrome ring at the still centre of the ring of cards stands in for the
brand's 3D mark. When the model arrives:

1. put it under `public/`, e.g. `public/brand/os.glb`: a plain `.glb` or
   `.gltf`, not Draco-compressed
2. set `mark3d: 'brand/os.glb'` in `content/src/brand.ts`
3. `npm run build`

Its own materials are replaced by the chrome, it is centred on its own bounds
and sized to the ring's middle (`MARK_SPAN` in `src/scene/centrepiece.ts`),
and it sways with the ring rather than spinning, so a word is always read from
the front. The glTF loader is fetched only when a mark is set: with `mark3d`
empty the build leaves it out entirely. A file that fails to load leaves the
chrome ring in its place.

## Motion

Everything that moves runs on transforms and opacity, which the compositor
handles, and stops for reduced motion or the page's "Pause motion" control.
What a visitor feels on every page (presses, the primary button's shine and
lean, rules that draw in, the reading line under the nav) is in
`src/styles/motion.css` and `src/ui/magnetic.ts`; the pricing cards (sliding
switch, rolling prices, tilt, the light round the chosen plan) are in
`src/styles/plans.css` and `src/ui/plans.ts`.
