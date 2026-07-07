// 1. Import the Serverless-specific build and the new Class
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
      // 2. Initialize the Class
      const ytdl = new YtdlCore();

      // 3. Use the new method getFullInfo() instead of getInfo()
      const info = await ytdl.getFullInfo(targetUrl);

      // 4. Manually find the best format (prioritize combined Video + Audio)
      let format = info.formats.find(f => f.hasVideo && f.hasAudio);
      
      // Fallback: if no combined stream exists, grab the first video stream
      if (!format) {
        format = info.formats.find(f => f.hasVideo) || info.formats[0];
      }

      if (!format || !format.url) {
        return new Response(JSON.stringify({ error: "No playable format found" }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 5. Redirect the browser directly to the media stream
      return Response.redirect(format.url, 302);

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
};
