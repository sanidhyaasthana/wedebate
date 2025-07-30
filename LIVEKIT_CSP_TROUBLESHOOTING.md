git add LICENSE
# LiveKit Content Security Policy (CSP) Troubleshooting Guide

## 🚨 Issue Resolved

The CSP configuration has been updated in [`next.config.js`](next.config.js) to allow LiveKit connections. The configuration now includes:

### Updated CSP Headers:
```javascript
connect-src 'self' https://wedebate-q5p3jywe.livekit.cloud wss://wedebate-q5p3jywe.livekit.cloud https://*.livekit.cloud wss://*.livekit.cloud
frame-src https://wedebate-q5p3jywe.livekit.cloud https://*.livekit.cloud
media-src 'self' blob: data: https://wedebate-q5p3jywe.livekit.cloud https://*.livekit.cloud
```

## 🔧 What Was Fixed

1. **Multiple module.exports**: Consolidated the conflicting export statements
2. **Missing LiveKit Domain**: Added your specific LiveKit domain `wedebate-q5p3jywe.livekit.cloud`
3. **WebSocket Support**: Added `wss://` protocol support for WebSocket connections
4. **Media Sources**: Added `media-src` directive for video/audio streams
5. **Wildcard Support**: Added `*.livekit.cloud` for broader LiveKit subdomain support

## 🔄 Next Steps

1. **Restart Development Server**: 
   ```bash
   npm run dev
   ```

2. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

3. **Test Connection**: Navigate to `/conference` and try joining a room

## 🐛 If Issues Persist

### Check Browser Console
Look for any remaining CSP violations and add the domains to the configuration.

### Verify Environment Variables
Ensure your `.env.local` has the correct LiveKit configuration:
```env
LIVEKIT_API_KEY=APIVBy5CPNCphHW
LIVEKIT_API_SECRET=9Y1HAejgi1HJWGekyogNhls0dnZGqveUbayOzCD9d31A
LIVEKIT_URL=wss://wedebate-q5p3jywe.livekit.cloud
NEXT_PUBLIC_LIVEKIT_HOST_URL=wss://wedebate-q5p3jywe.livekit.cloud
```

### Alternative: Disable CSP for Development
If you need to temporarily disable CSP for testing, you can comment out the headers section in `next.config.js`:

```javascript
// async headers() {
//   return [];
// },
```

**⚠️ Warning**: Only disable CSP for development. Always enable it for production.

## 📋 CSP Directives Explained

- **`connect-src`**: Controls which URLs can be loaded using script interfaces (fetch, WebSocket, etc.)
- **`frame-src`**: Controls which URLs can be embedded as frames
- **`media-src`**: Controls which URLs can be loaded as video/audio sources
- **`script-src`**: Controls which scripts can be executed
- **`style-src`**: Controls which stylesheets can be applied

## 🔒 Production Security

The current CSP configuration balances functionality with security. For production, consider:

1. **Removing wildcards**: Replace `*.livekit.cloud` with specific subdomains
2. **Removing 'unsafe-inline'**: Implement nonce-based CSP for scripts/styles
3. **Adding report-uri**: Monitor CSP violations in production

## 📞 Support

If you continue experiencing issues:
1. Check the browser's Network tab for failed requests
2. Look for CSP violation reports in the Console
3. Verify the LiveKit server is accessible from your domain
4. Test with a minimal CSP configuration first

The video conferencing system should now work without CSP violations!