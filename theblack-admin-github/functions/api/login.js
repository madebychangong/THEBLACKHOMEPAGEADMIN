import { createSessionCookie, validatePassword } from "../_shared/auth.js";
import { json, methodNotAllowed } from "../_shared/response.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    if (!validatePassword(String(body.password || ""), env)) {
      return json({ error: "비밀번호를 확인해주세요." }, { status: 401 });
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
