// Static demo build -> dist-demo/ for /demos/evently/.
// Next's static export cannot include API routes or middleware, so they are moved aside for the build and restored after.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const BP = "/demos/evently";
const aside = [["app/api", ".demo-aside/api"], ["middleware.ts", ".demo-aside/middleware.ts"]];
fs.mkdirSync(".demo-aside", { recursive: true });
const moved = [];
try {
  for (const [from, to] of aside) if (fs.existsSync(from)) { fs.renameSync(from, to); moved.push([from, to]); }
  fs.rmSync("dist-demo", { recursive: true, force: true });
  fs.rmSync(".next", { recursive: true, force: true });
  const r = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
    stdio: "inherit",
    env: { ...process.env, NEXT_PUBLIC_DEMO: "1", NEXT_PUBLIC_API_MODE: "mock", NEXT_TELEMETRY_DISABLED: "1" },
  });
  if (r.status !== 0) throw new Error("next build failed");
} finally {
  for (const [from, to] of moved) fs.renameSync(to, from);
  fs.rmSync(".demo-aside", { recursive: true, force: true });
}

// Post-process: base-path the root-absolute asset URLs Next leaves alone, and add the banner.
fs.copyFileSync("demo/banner.js", "dist-demo/demo-banner.js");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
for (const f of walk("dist-demo")) {
  if (f.endsWith(".html")) {
    let s = fs.readFileSync(f, "utf8");
    s = s.replace(/(href|src)="\/(events|logo\.svg)/g, `$1="${BP}/$2`);
    s = s.replace("</body>", `<script src="${BP}/demo-banner.js"></script></body>`);
    fs.writeFileSync(f, s);
  } else if (f.endsWith(".css")) {
    fs.writeFileSync(f, fs.readFileSync(f, "utf8").replace(/url\((['"]?)\/assets\//g, `url($1${BP}/assets/`));
  }
}
console.log("built dist-demo/");
