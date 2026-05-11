import { verifySession } from "../_shared/auth.js";
import { json } from "../_shared/response.js";

export async function onRequestGet({ request, env }) {
  return json({ authenticated: await verifySession(request, env) });
}
