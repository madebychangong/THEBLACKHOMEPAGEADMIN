const COOKIE_NAME = "tb_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function createSessionCookie(env) {
  const issuedAt = Date.now().toString();
  const signature = await sign(issuedAt, env);
  const value = `${issuedAt}.${signature}`;

  return `${COOKIE_NAME}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function verifySession(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const value = cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  if (!value) return false;

  const [issuedAt, signature] = value.split(".");
  const timestamp = Number(issuedAt);
  if (!Number.isFinite(timestamp)) return false;
  if (Date.now() - timestamp > MAX_AGE_SECONDS * 1000) return false;

  const expected = await sign(issuedAt, env);
  return signature === expected;
}

export function verifyPassword(password, env) {
  const expected = String(env.ADMIN_PASSWORD || "").trim();
  return Boolean(expected) && String(password || "") === expected;
}

async function sign(value, env) {
  const secret = String(env.SESSION_SECRET || "");
  if (!secret) return "";

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64Url(signature);
}

function base64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
