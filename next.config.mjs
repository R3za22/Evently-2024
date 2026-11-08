import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const isDemo = process.env.NEXT_PUBLIC_DEMO === "1";

/** @type {import('next').NextConfig} */
const nextConfig = isDemo
  ? {
      // Static demo for /demos/evently/ (see demo/build.mjs): auth/DB/payments are not part of it.
      output: "export",
      distDir: "dist-demo",
      basePath: "/demos/evently",
      trailingSlash: true,
      images: { loader: "custom", loaderFile: "./demo/image-loader.js" },
      webpack: (config) => {
        config.resolve.alias["@clerk/nextjs"] = path.join(here, "demo/stubs/clerk.tsx");
        return config;
      },
    }
  : {};

export default nextConfig;
