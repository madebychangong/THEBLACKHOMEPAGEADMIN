import { verifySession } from "../_shared/auth.js";
import { json, methodNotAllowed } from "../_shared/response.js";
import { readCatalog, writeCatalog } from "../_shared/store.js";

const styles = new Set(["basic", "recommended", "popular", "paused", "event"]);

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const adminMode = url.searchParams.get("admin") === "1";

  if (adminMode && !(await verifySession(request, env))) {
    return json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }

  const catalog = await readCatalog(env);
  return json(adminMode ? catalog : toPublicCatalog(catalog));
}

export async function onRequestPut({ request, env }) {
  if (!(await verifySession(request, env))) {
    return json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const catalog = normalizeCatalog(body);
    await writeCatalog(env, catalog);
    return json({ ok: true, catalog });
  } catch (error) {
    return json({ error: error.message || "저장에 실패했습니다." }, { status: 400 });
  }
}

export function onRequestPost() {
  return methodNotAllowed();
}

function toPublicCatalog(catalog) {
  return {
    site: {
      channelTalkPluginKey: cleanText(catalog.site?.channelTalkPluginKey, 120),
      kakaoOpenChatUrl: cleanText(catalog.site?.kakaoOpenChatUrl, 500)
    },
    hero: normalizeHero(catalog.hero),
    sections: normalizeSections(catalog.sections)
      .filter((section) => section.visible)
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.visible)
      }))
      .filter((section) => section.items.length > 0),
    updatedAt: cleanText(catalog.updatedAt, 80)
  };
}

function normalizeCatalog(input) {
  return {
    site: {
      channelTalkPluginKey: cleanText(input.site?.channelTalkPluginKey, 120),
      kakaoOpenChatUrl: cleanText(input.site?.kakaoOpenChatUrl, 500)
    },
    hero: normalizeHero(input.hero),
    stats: normalizeStats(input.stats),
    sections: normalizeSections(input.sections),
    updatedAt: new Date().toISOString()
  };
}

function normalizeHero(hero = {}) {
  return {
    eyebrow: cleanText(hero.eyebrow, 60) || "PREMIUM ITEM DESK",
    title: cleanText(hero.title, 80) || "THE BLACK SHOP",
    subtitle: cleanText(hero.subtitle, 240),
    primaryCta: cleanText(hero.primaryCta, 30) || "채널톡 상담",
    secondaryCta: cleanText(hero.secondaryCta, 30) || "카카오 오픈채팅"
  };
}

function normalizeStats(stats = {}) {
  const min = clampNumber(stats.talkingMin, 1, 99, 3);
  const max = clampNumber(stats.talkingMax, min, 99, 8);
  return {
    talkingMin: min,
    talkingMax: max,
    todayBase: clampNumber(stats.todayBase, 0, 999999, 420),
    totalBase: clampNumber(stats.totalBase, 0, 99999999, 48210),
    dailyGrowth: clampNumber(stats.dailyGrowth, 0, 9999, 87),
    startedAt: cleanText(stats.startedAt, 20) || "2026-05-01"
  };
}

function normalizeSections(sections = []) {
  if (!Array.isArray(sections)) return [];
  return sections.slice(0, 24).map((section, sectionIndex) => ({
    id: cleanId(section.id) || `section-${sectionIndex + 1}`,
    title: cleanText(section.title, 60) || "가격 섹션",
    subtitle: cleanText(section.subtitle, 120),
    style: styles.has(section.style) ? section.style : "basic",
    visible: section.visible !== false,
    items: normalizeItems(section.items)
  }));
}

function normalizeItems(items = []) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 80).map((item, itemIndex) => ({
    id: cleanId(item.id) || `item-${itemIndex + 1}`,
    name: cleanText(item.name, 70) || "상품",
    unit: cleanText(item.unit, 80),
    price: cleanText(item.price, 50) || "상담 문의",
    badge: cleanText(item.badge, 24),
    style: styles.has(item.style) ? item.style : "basic",
    visible: item.visible !== false
  }));
}

function cleanText(value, maxLength) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanId(value) {
  return String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80);
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}
