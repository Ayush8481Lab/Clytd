import ytdl from '@ybd-project/ytdl-core';

export default {
  async fetch(request, env, ctx) {
    // 1. Parse the incoming request URL
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    // 2. Validate input
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "Missing ?url= parameter" }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      // 3. Extract media info using the ytdl library
      const info = await ytdl.getInfo(targetUrl);

      // 4. Choose the best format (e.g., highest quality with both audio and video)
      // Alternatively, you can use 'highestaudio' for an audio-only redirect
      const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });

      if (!format || !format.url) {
        return new Response(JSON.stringify({ error: "No suitable format found" }), { status: 404 });
      }

      // 5. Generate the Redirect Response
      // This sends a 302 status, forcing the browser/player to redirect to the raw Google Video URL
      return Response.redirect(format.url, 302);

    } catch (error) {
      // Handle extraction errors (e.g., age-restricted videos or invalid links)
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
};
