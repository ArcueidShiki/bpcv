export default {
    async fetch(request) {
      return new Response("Hello, Cloudflare Workers!", {
        headers: { "content-type": "text/plain" },
      });
    },
  };