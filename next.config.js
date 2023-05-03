/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["storage.googleapis.com"],
  },
};

module.exports = nextConfig;
