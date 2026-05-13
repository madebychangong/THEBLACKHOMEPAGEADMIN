const guardedPaths = new Set(["/api/login", "/api/logout", "/api/session"]);

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const adminHosts = String(env.ADMIN_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  if (adminHosts.length && isGuardedRequest(url, request.method)) {
    const host = url.hostname.toLowerCase();
    if (!adminHosts.includes(host)) {
      return new Response("Not found", { status: 404 });
    }
  }

  return next();
}

function isGuardedRequest(url, method) {
  if (url.pathname.startsWith("/admin")) return true;
  if (guardedPaths.has(url.pathname)) return true;
  if (url.pathname === "/api/prices" && method !== "GET") return true;
  if (url.pathname === "/api/prices" && url.searchParams.get("admin") === "1") return true;
  return false;
}
