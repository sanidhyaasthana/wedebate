/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  }
};

module.exports = {
  env: {
    DAILY_API_KEY: process.env.DAILY_API_KEY,
  },
};

module.exports = nextConfig;



module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              connect-src 'self' https://api.daily.co https://your-livekit-url.com;
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              frame-src https://*.daily.co https://your-livekit-url.com;
            `.replace(/\s{2,}/g, ' ').trim()
          },
        ],
      },
    ];
  },
};
