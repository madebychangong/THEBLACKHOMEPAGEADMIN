import { createSessionCookie, validatePassword } from "../_shared/auth.js";
import { json, methodNotAllowed } from "../_shared/response.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    if (!env.ADMIN_PASSWORD) {
      return json({ error: "Cloudflare에 ADMIN_PASSWORD가 설정되지 않았습니다." }, { status: 500 });
    }
    if (!env.SESSION_SECRET) {
      return json({ error: "Cloudflare에 SESSION_SECRET이 설정되지 않았습니다." }, { status: 500 });
    }
    if (!validatePassword(String(body.password || ""), env)) {
      return json({ error: "비밀번호가 다릅니다. Cloudflare의 ADMIN_PASSWORD 값을 다시 확인해주세요." }, { status: 401 });
    }

    return json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": await createSessionCookie(request, env)
        }
      }
    );
  } catch (error) {
    return json({ error: error.message || "로그인에 실패했습니다." }, { status: 400 });
  }
}

export function onRequestGet() {
  return methodNotAllowed();
}
