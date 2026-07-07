import { YtdlCore } from '@ybd-project/ytdl-core/serverless';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "Missing ?url= parameter" }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const ytdl = new YtdlCore();
      const info = await ytdl.getFullInfo(targetUrl);

      // 1. Check if YouTube returned ZERO formats (Bot block / IP block)
      if (!info.formats || info.formats.length === 0) {
        return new Response(JSON.stringify({ 
          error: "YouTube blocked the request or returned 0 formats.", 
          playability_status: info.player_response?.playabilityStatus?.status || "Unknown",
          playability_reason: info.player_response?.playabilityStatus?.reason || "Cloudflare IP likely blocked by YouTube anti-bot."
        }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 2. Try to find a standard combined Audio + Video format first
      let format = info.formats.find(f => f.hasVideo && f.hasAudio && f.url);
      
      // 3. If none exist, aggressively grab the FIRST format that has ANY valid URL
      if (!format) {
        format = info.formats.find(f => f.url);
      }

      // 4. If formats exist but they are locked/ciphered without a URL
      if (!format || !format.url) {
        return new Response(JSON.stringify({ 
          error: "Formats exist, but none contain a direct playback URL.", 
          total_formats_found: info.formats.length,
          sample_format: info.formats[0] // Prints a sample to see why it's missing a URL
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 5. Success! Redirect the browser directly to the media stream
      return Response.redirect(format.url, 302);

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: "ytdl-core crashed during extraction",
        details: error.message 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
};
