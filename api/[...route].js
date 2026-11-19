import { Readable } from "node:stream";
import { createHostedApi } from "../server/hosted.js";

let hostedApi;

function getHostedApi() {
  hostedApi ??= Promise.resolve().then(createHostedApi).catch((error) => {
    hostedApi = undefined;
    throw error;
  });
  return hostedApi;
}

export default {
  async fetch(request) {
    // Keep the raw stream for readJson's size and content-type checks.
    const url = new URL(request.url);
    const req = Object.assign(
      request.body
        ? Readable.fromWeb(request.body, { signal: request.signal })
        : Readable.from([]),
      {
        url: url.pathname + url.search,
        method: request.method,
        headers: { ...Object.fromEntries(request.headers), host: url.host },
        socket: {},
      },
    );
    const headers = new Headers();
    let response;
    const res = {
      statusCode: 200,
      writableEnded: false,
      setHeader(key, value) {
        headers.set(key, String(value));
      },
      end(body) {
        response = new Response(body, { status: this.statusCode, headers });
        this.writableEnded = true;
      },
    };

    try {
      const api = await getHostedApi();
      await api.handler(req, res);
      if (response) return response;
    } catch {
      console.error("Hosted game API unavailable");
    }
    return Response.json(
      { error: "temporarily_unavailable" },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": "5",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  },
};
