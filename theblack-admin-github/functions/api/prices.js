import { verifySession } from "../_shared/auth.js";
import { json, methodNotAllowed } from "../_shared/response.js";
import { readPrices, toPublicPrices, writePrices } from "../_shared/prices-store.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const adminMode = url.searchParams.get("admin") === "1";

  if (adminMode && !(await verifySession(request, env))) {
    return json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const prices = await readPrices(env);
  return json(adminMode ? prices : toPublicPrices(prices));
}

export async function onRequestPut({ request, env }) {
  if (!(await verifySession(request, env))) {
    return json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const catalog = await writePrices(env, body);
    return json({ ok: true, catalog });
  } catch (error) {
    return json({ error: error.message || "저장에 실패했습니다." }, { status: 400 });
  }
}

export function onRequestPost() {
  return methodNotAllowed();
}
