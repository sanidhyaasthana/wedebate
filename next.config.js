/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  env: {
    DAILY_API_KEY: process.env.DAILY_API_KEY,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              connect-src 'self' https://api.daily.co https://wedebate-q5p3jywe.livekit.cloud wss://wedebate-q5p3jywe.livekit.cloud https://*.livekit.cloud wss://*.livekit.cloud;
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              frame-src https://*.daily.co https://wedebate-q5p3jywe.livekit.cloud https://*.livekit.cloud;
              media-src 'self' blob: data: https://wedebate-q5p3jywe.livekit.cloud https://*.livekit.cloud;
              img-src 'self' data: blob: https:;
              font-src 'self' data:;
            `.replace(/\s{2,}/g, ' ').trim()
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
