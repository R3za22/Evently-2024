const isDemo = process.env.NEXT_PUBLIC_DEMO === "1";
const basePath = isDemo ? "/demos/evently" : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(isDemo
    ? {
        // Static demo for /demos/evently/ (see demo/build.mjs): mock API + mock auth, nothing leaves the origin.
        output: "export",
        distDir: "dist-demo",
        basePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
