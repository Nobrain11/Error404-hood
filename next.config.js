/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin images from Blockscout
  images: {
    domains: ["robinhoodchain.blockscout.com"],
  },
  // Proxy Blockscout API calls server-side to avoid CORS
  async rewrites() {
    return [
      {
        source: "/blockscout/:path*",
        destination: "https://robinhoodchain.blockscout.com/api/v2/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
