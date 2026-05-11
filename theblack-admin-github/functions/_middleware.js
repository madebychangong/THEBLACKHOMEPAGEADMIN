import { isAdminHost } from "./_shared/hosts.js";

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const adminHost = isAdminHost(request, env);

  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
    return adminHost ? next() : notFound();
  }

  if (isAdminApiRequest(url, request.method) && !adminHost) {
    return notFound();
  }

  const response = await next();

  if (!adminHost || !isHtmlResponse(response)) {
    return response;
  }

  return new HTMLRewriter()
    .on("head", {
      element(element) {
        element.append('<script>window.__THEBLACK_ADMIN_HOST__=true;</script>', {
          html: true
        });
      }
    })
    .transform(response);
}

function isAdminApiRequest(url, method) {
  if (url.pathname === "/api/login") return true;
  if (url.pathname === "/api/logout") return true;
  if (url.pathname === "/api/session") return true;
  if (url.pathname === "/api/catalog" && method !== "GET") return true;
  if (url.pathname === "/api/catalog" && url.searchParams.get("admin") === "1") return true;
  return false;
}

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function isHtmlResponse(response) {
  return (response.headers.get("Content-Type") || "").includes("text/html");
}
