const SESSION_COOKIE = "tb_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export async function createSessionCookie(request, env) {
  const secret = requireSessionSecret(env);
  const payload = {
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
    nonce: crypto.randomUUID()
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(encodedPayload, secret);
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";

  return `${SESSION_COOKIE}=${encodedPayload}.${signature}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; SameSite=Strict${secure}`;
}

export function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${secure}`;
}

export async function verifySession(request, env) {
  const secret = env.SESSION_SECRET;
  if (!secret) return false;

  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const raw = cookies[SESSION_COOKIE];
  if (!raw || !raw.includes(".")) return false;

  const [encodedPayload, signature] = raw.split(".");
  const expected = await sign(encodedPayload, secret);
  if (!timingSafeEqual(signature, expected)) return false;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function validatePassword(password, env) {
  const adminPassword = env.ADMIN_PASSWORD;
  return Boolean(adminPassword && password && password === adminPassword);
}

function requireSessionSecret(env) {
  if (!env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is missing.");
  }
  return env.SESSION_SECRET;
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

function parseCookies(cookieHeader) {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return index === -1
          ? [part, ""]
          : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function timingSafeEqual(left, right) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

function base64UrlEncode(value) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return atob(padded);
}

function bytesToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
