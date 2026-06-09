import * as esbuild from "esbuild";
import * as fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const production = process.argv.includes("--production");

const outfile = manifest.entry;

await esbuild.build({
  entryPoints: ["src/extension.ts"],
  outfile,
  bundle: true,
  format: "cjs",
  platform: "node",
  sourcesContent: false,
  logLevel: "info",
  minify: production,
  sourcemap: !production,
  loader: { ".html": "text", ".css": "text", ".woff2": "dataurl" },
});
