import { createSessionCookie, verifyPassword } from "../_shared/auth.js";
import { json } from "../_shared/response.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    if (!verifyPassword(body.password, env) || !env.SESSION_SECRET) {
      return json({ error: "비밀번호가 다릅니다." }, { status: 401 });
    }

    return json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": await createSessionCookie(env)
        }
      }
    );
  } catch {
    return json({ error: "로그인할 수 없습니다." }, { status: 400 });
  }
}
