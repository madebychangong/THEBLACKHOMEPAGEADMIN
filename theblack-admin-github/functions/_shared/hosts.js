export function isAdminHost(request, env) {
  const host = normalizeHost(request.headers.get("Host") || "");
  if (!host) return false;

  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return true;
  }

  const allowedHosts = String(env.ADMIN_HOSTS || "")
    .split(",")
    .map(normalizeHost)
    .filter(Boolean);

  return allowedHosts.includes(host);
}

export function normalizeHost(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}
