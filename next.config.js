const withPlugins = require('next-compose-plugins');

/** @type {import('next').NextConfig} */
module.exports = withPlugins([
  {
      reactStrictMode: true,
      webpack5: true,
      webpack: (config, { isServer }) => {
          if (!isServer) {
            config.resolve.fallback = {
              fs: false,
              crypto: false,
              os: false,
              path: false,
          };
          }
          return config;
      },
      images: {
          domains: ['arweave.net','www.arweave.net'],
      },
  },
]);