// @ts-check

async function main() {
  await require("esbuild").build({
    entryPoints: ["./airplay-worker.js"],
    bundle: true,
    platform: "node",
    outdir: "dist",
    external: ["./build"],
    loader: {
      ".node": "file",
    },
    // minify: true,
    // minifyIdentifiers: true,
    sourcemap: true,
  });

  await require("esbuild").build({
    entryPoints: ["./izanami.js"],
    bundle: true,
    platform: "node",
    outdir: "dist",
    external: ["./build"],
    loader: {
      ".node": "file",
    },
    sourcemap: true,

    // minify: true,
    // minifyIdentifiers: true,
  });
}
main();
