import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    'unslumping-aliyah-xeric.ngrok-free.dev',
    'https://unslumping-aliyah-xeric.ngrok-free.dev',
  ],
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
