import { clearSessionCookie } from "../_shared/auth.js";
import { json, methodNotAllowed } from "../_shared/response.js";

export function onRequestPost({ request }) {
  return json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(request)
      }
    }
  );
}

export function onRequestGet() {
  return methodNotAllowed();
}
