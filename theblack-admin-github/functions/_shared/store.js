import { defaultCatalog } from "./default-catalog.js";

const CATALOG_KEY = "theblack:catalog:v1";

export async function readCatalog(env) {
  const kv = getKV(env);
  if (!kv) return defaultCatalog;

  const stored = await kv.get(CATALOG_KEY, "json");
  return stored || defaultCatalog;
}

export async function writeCatalog(env, catalog) {
  const kv = getKV(env);
  if (!kv) {
    throw new Error("THEBLACK_KV binding is missing.");
  }

  await kv.put(CATALOG_KEY, JSON.stringify(catalog));
}

function getKV(env) {
  return env.THEBLACK_KV || env.BLACKSHOP_KV || env.KV;
}
