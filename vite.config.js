import { defineConfig } from "vite";
import pug from "pug";
import fs from "fs";
import { resolve, basename, relative, sep } from "path"; // додали relative та sep
import { glob } from "glob";
import { iconsSpritesheet } from "vite-plugin-icons-spritesheet";
import { exec } from "child_process";

const entryPoints = glob.sync(["index.pug", "src/pages/**/*.pug"]).reduce((acc, path) => {
  const name = basename(path, ".pug");
  const key = `${name}.html`;
  acc[key] = resolve(__dirname, path);
  return acc;
}, {});

const virtualModuleMap = Object.keys(entryPoints).reduce((acc, key) => {
  acc[resolve(__dirname, key)] = entryPoints[key];
  return acc;
}, {});

function injectIncludes(content, includes) {
  const lines = content.split(/\r?\n/);

  const extendsIndex = lines.findIndex((line) => line.trim().startsWith("extends "));

  if (extendsIndex !== -1) {
    lines.splice(extendsIndex + 1, 0, includes);
    return lines.join("\n");
  } else {
    return `${includes}\n${content}`;
  }
}

function generateAutoIncludes() {
  const components = glob.sync(["src/widgets/**/*.pug", "src/features/**/*.pug", "src/shared/ui/**/*.pug"]);

  return components
    .map((filepath) => {
      const absolutePath = resolve(__dirname, filepath);
      const relativeToSrc = relative(resolve(__dirname, "src"), absolutePath);
      const normalizedPath = relativeToSrc.split(sep).join("/");

      return `include /${normalizedPath}`;
    })
    .join("\n");
}

export default defineConfig({
  plugins: [
    iconsSpritesheet({
      inputDir: "./src/shared/icons",
      outputDir: "./public",
      fileName: "icons.svg",
    }),
    {
      name: "vite-plugin-auto-build",
      apply: "serve",
      configureServer(server) {
        let isBuilding = false;

        server.watcher.on("change", (file) => {
          if (file.includes("dist")) return;

          if (!isBuilding) {
            isBuilding = true;
            console.log("🔄 File changed, rebuilding dist...");

            exec("npm run build", (err, stdout, stderr) => {
              if (err) {
                console.error("❌ Build error:", stderr);
              } else {
                console.log("✅ Build complete!");
              }
              isBuilding = false;
            });
          }
        });
      },
    },
    {
      name: "vite-plugin-pug-resolver",
      resolveId(id, importer) {
        if (!importer && entryPoints[id]) {
          return resolve(__dirname, id);
        }
      },

      load(id) {
        if (virtualModuleMap[id]) {
          const pugPath = virtualModuleMap[id];
          const content = fs.readFileSync(pugPath, "utf-8");
          const autoIncludes = generateAutoIncludes();

          const finalContent = injectIncludes(content, autoIncludes);

          return pug.render(finalContent, {
            filename: pugPath,
            basedir: resolve(__dirname, "src"),
            pretty: true,
          });
        }
      },

      configureServer(server) {
        server.watcher.on("change", (file) => {
          if (file.endsWith(".pug") || file.endsWith("scss")) {
            server.ws.send({ type: "full-reload", path: "*" });
          }
        });
        server.middlewares.use(async (req, res, next) => {
          try {
            const url = req.url.split("?")[0].split("#")[0];
            const candidates = [];
            if (url === "/" || url === "/index.html") {
              candidates.push(resolve(__dirname, "index.pug"));
            } else {
              const raw = url.replace(/^\//, "").replace(/\.html$/, "");
              candidates.push(resolve(__dirname, raw + ".pug"));
              candidates.push(resolve(__dirname, "src", raw + ".pug"));
              candidates.push(resolve(__dirname, "src/pages", raw, raw + ".pug"));
              candidates.push(resolve(__dirname, "src/pages", raw + ".pug"));
            }
            for (const filePath of candidates) {
              if (filePath && fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, "utf-8");
                const autoIncludes = generateAutoIncludes();

                const finalContent = injectIncludes(content, autoIncludes);

                const html = pug.render(finalContent, {
                  filename: filePath,
                  basedir: resolve(__dirname, "src"),
                });
                const processedHtml = await server.transformIndexHtml(req.url, html);
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                res.end(processedHtml, "utf8");
                return;
              }
            }
          } catch (err) {
            return next(err);
          }
          next();
        });
      },
    },
  ],
  root: ".",
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      input: Object.keys(entryPoints),
      output: {
        entryFileNames: `assets/scripts/[name].js`,
        chunkFileNames: `assets/scripts/[name].js`,
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split(".").at(-1);
          if (/css/i.test(extType)) {
            return `assets/styles/[name][extname]`;
          }
          if (/mp4|webm|ogg|mov|avi|wmv/i.test(extType)) {
            return `assets/videos/[name][extname]`;
          }
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name][extname]`;
          }
          if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            return `assets/fonts/[name][extname]`;
          }
          return `assets/[name][extname]`;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@app": resolve(__dirname, "src/app"),
      "@pages": resolve(__dirname, "src/pages"),
      "@widgets": resolve(__dirname, "src/widgets"),
      "@features": resolve(__dirname, "src/features"),
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
        @use "@app/styles/vars.scss" as *;
        @use "@app/styles/mixins.scss" as *;`,
      },
    },
  },
});
