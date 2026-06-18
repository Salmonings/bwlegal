import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      // Documents are PDF/JPG/PNG up to 15 MB (enforced again in the actions
      // themselves); the framework default of 1 MB would reject most uploads.
      bodySizeLimit: "16mb",
    },
    // proxy.ts runs on every page route (only /api is excluded), including
    // the ones these upload forms post to. Next.js buffers the request body
    // there up to this limit and silently truncates the rest instead of
    // failing — the 10 MB default would corrupt, not reject, 10-15 MB files.
    proxyClientMaxBodySize: "16mb",
  },
};

export default nextConfig;
