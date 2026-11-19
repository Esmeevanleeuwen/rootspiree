export class ApiError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const WRITE_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const MAX_JSON_BYTES = 256 * 1024;

export function assertWriteOrigin(req, origin, secureCookies) {
  if (!WRITE_METHODS.has(req.method)) return;
  const requestOrigin = req.headers.origin;
  const expected =
    origin || (secureCookies ? "https://" : "http://") + req.headers.host;
  // Cross-origin browser requests can try to send cookies from a sibling subdomain.
  if (
    (requestOrigin && requestOrigin !== expected) ||
    (!requestOrigin &&
      ["cross-site", "same-site"].includes(req.headers["sec-fetch-site"]))
  ) {
    throw new ApiError(403, "invalid_origin");
  }
}

export async function readJson(req) {
  if (!WRITE_METHODS.has(req.method)) return {};
  const declaredLength = Number(req.headers["content-length"]);
  if (declaredLength > MAX_JSON_BYTES) {
    req.resume();
    throw new ApiError(413, "invalid_input");
  }
  const contentType = req.headers["content-type"]
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length;
    if (bytes <= MAX_JSON_BYTES) chunks.push(chunk);
    if (bytes > MAX_JSON_BYTES) {
      // Respond immediately instead of buffering an oversized body. Keep the
      // stream readable so Node can deliver the error response.
      req.resume();
      throw new ApiError(413, "invalid_input");
    }
  }
  if (bytes === 0) return {};
  if (contentType !== "application/json")
    throw new ApiError(415, "invalid_input");
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || Array.isArray(body) || typeof body !== "object")
      throw new Error();
    return body;
  } catch {
    throw new ApiError(400, "invalid_input");
  }
}
