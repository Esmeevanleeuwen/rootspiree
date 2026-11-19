export async function api(path, { method = "GET", data, signal } = {}) {
  const response = await fetch("/api" + path, {
    method,
    signal,
    headers:
      data === undefined ? undefined : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result === null) {
    const error = new Error(result?.error || "server_error");
    error.status = response.status;
    throw error;
  }
  return result;
}
