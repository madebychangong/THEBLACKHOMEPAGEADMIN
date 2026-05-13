import { clearSessionCookie } from "../_shared/auth.js";
import { json } from "../_shared/response.js";

export function onRequestPost() {
  return json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": clearSessionCookie()
      }
    }
  );
}
