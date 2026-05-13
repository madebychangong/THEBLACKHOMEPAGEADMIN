export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(init.headers || {})
    }
  });
}

export function methodNotAllowed() {
  return json({ error: "허용되지 않는 요청입니다." }, { status: 405 });
}
