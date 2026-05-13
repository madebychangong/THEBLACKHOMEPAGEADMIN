import { readPriceData } from "../../src/encoded-prices.js";

const PRICES_KEY = "theblack:board:v1";

export async function readPrices(env) {
  const kv = getKV(env);
  if (!kv) return normalizePrices(readPriceData());

  const saved = await kv.get(PRICES_KEY, "json");
  return normalizePrices(saved || readPriceData());
}

export async function writePrices(env, data) {
  const kv = getKV(env);
  if (!kv) throw new Error("저장 공간 연결이 필요합니다.");

  const normalized = normalizePrices({
    ...data,
    updatedAt: new Date().toISOString()
  });
  await kv.put(PRICES_KEY, JSON.stringify(normalized));
  return normalized;
}

export function toPublicPrices(data) {
  const normalized = normalizePrices(data);
  return {
    ...normalized,
    products: normalized.products.filter((product) => product.visible !== false)
  };
}

function normalizePrices(input = {}) {
  const site = input.site || {};
  return {
    site: {
      brand: cleanText(site.brand, 40) || "더블랙샵",
      title: cleanText(site.title, 40) || "디4 시세표",
      subtitle: cleanText(site.subtitle, 120),
      notice: cleanText(site.notice, 160),
      hours: cleanText(site.hours, 80),
      kakaoOneToOneUrl: cleanText(site.kakaoOneToOneUrl, 500),
      kakaoGroupUrl: cleanText(site.kakaoGroupUrl, 500),
      tags: normalizeTags(site.tags)
    },
    products: normalizeProducts(input.products),
    updatedAt: cleanText(input.updatedAt, 80)
  };
}

function normalizeTags(tags) {
  const fallback = ["대기X출발", "최저가대응", "재고확인", "빠른답변"];
  if (!Array.isArray(tags)) return fallback;
  return fallback.map((value, index) => cleanText(tags[index], 20) || value);
}

function normalizeProducts(products) {
  if (!Array.isArray(products)) return [];

  return products.slice(0, 120).map((product) => ({
    icon: cleanText(product.icon, 8),
    name: cleanText(product.name, 80) || "상품",
    description: cleanText(product.description, 180),
    badge: cleanText(product.badge, 24),
    visible: product.visible !== false,
    rows: normalizeRows(product.rows)
  }));
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return [];

  return rows.slice(0, 40).map((row) => ({
    label: cleanText(row.label, 60),
    price: cleanText(row.price, 60)
  }));
}

function cleanText(value, maxLength) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function getKV(env) {
  return env.THEBLACK_KV || env.BLACKSHOP_KV || env.KV;
}
