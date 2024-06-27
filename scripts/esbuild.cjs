// @ts-check

async function main() {

  const excludedFromBundle = [
    'castv2-client',
    'castv2',
  ]

  await require("esbuild").build({
    entryPoints: ["./airplay-worker.js"],
    bundle: true,
    platform: "node",
    outdir: "dist",
    external: ["./build", ...excludedFromBundle],
    treeShaking: false,
    loader: {
      ".node": "file",
      ".proto": "file",
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
    external: ["./build", ...excludedFromBundle],
    treeShaking: false,

    loader: {
      ".node": "file",
      ".proto": "file",
    },
    sourcemap: true,

    // minify: true,
    // minifyIdentifiers: true,
  });
}
main();
