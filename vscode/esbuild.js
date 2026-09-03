// Bundle the notebook renderer to a single ESM file (out/renderer.js), the
// `entrypoint` declared in package.json's contributes.notebookRenderer.
const esbuild = require("esbuild");

const options = {
  entryPoints: ["src/renderer.ts"],
  bundle: true,
  format: "esm",
  target: "es2020",
  outfile: "out/renderer.js",
  minify: process.argv.includes("--minify"),
  sourcemap: !process.argv.includes("--minify"),
};

if (process.argv.includes("--watch")) {
  esbuild.context(options).then((ctx) => ctx.watch());
} else {
  esbuild.build(options).catch(() => process.exit(1));
}
