import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle for the container image.
  output: "standalone",
  // This app lives inside a monorepo; pin tracing to the app directory.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
