import { defineConfig } from 'vite';
import { BRAND } from './content/src/index.ts';
import { demoServices } from './build/demo.ts';
import { site } from './build/site.ts';

export default defineConfig(({ isPreview }) => ({
  plugins: [site(), demoServices()],
  // written into the code at build time: with no 3D mark set, the glTF loader
  // and the parts of three.js only it needs are never in the page at all
  define: { __MARK3D__: JSON.stringify(BRAND.mark3d) },
  // every address (/pricing/, /workflows/<key>/) is served index.html in dev; the build
  // prerenders each, so the preview serves the files as a host would, 404 included
  appType: isPreview ? 'mpa' : 'spa',
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: {
    target: 'es2022',
    // source maps beside the scripts: a browser fetches them only when someone opens its developer
    // tools, so a visitor downloads nothing more, and an error report points at real lines
    sourcemap: true,
    // nothing is inlined but the ring's placeholder, which has to be there with the first paint
    assetsInlineLimit: (file) => /ring-ghost-/.test(file),
    // three.js alone is ~550 kB minified; it and GSAP get chunks of their own so a
    // change to the page does not make returning visitors fetch them again, and
    // three loads after the page is already readable (see app.ts). Only three's
    // core goes in that chunk: its examples (the glTF loader for the 3D mark)
    // stay chunks of their own, fetched only by a page that uses them, rather
    // than riding along with the core for every visitor
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]build[\\/]/ },
            { name: 'gsap', test: /node_modules[\\/]gsap[\\/]/ },
          ],
        },
      },
    },
  },
}));
