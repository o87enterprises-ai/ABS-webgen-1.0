import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    rules: {
      '*.{ogg,mp3,wav,mpeg}': {
        loaders: ['builtin:file-loader'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [new URL('https://huggingface.co/**')],
  },
};

export default nextConfig;
