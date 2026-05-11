import { json } from "../_shared/response.js";
import { readCatalog } from "../_shared/store.js";

export async function onRequestGet({ env }) {
  const catalog = await readCatalog(env);
  const stats = catalog.stats || {};
  const now = new Date();
  const seed = await hash(`${toKoreaDateKey(now)}:${Math.floor(now.getMinutes() / 7)}`);
  const talkingMin = clamp(stats.talkingMin, 1, 99, 3);
  const talkingMax = clamp(stats.talkingMax, talkingMin, 99, 8);
  const talkingRange = Math.max(1, talkingMax - talkingMin + 1);
  const talking = talkingMin + (seed % talkingRange);
  const startedAt = new Date(stats.startedAt || "2026-05-01");
  const elapsedDays = Number.isFinite(startedAt.getTime())
    ? Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 86400000))
    : 0;
  const koreaHour = Number(toKoreaDateParts(now).hour);
  const today = clamp(stats.todayBase, 0, 999999, 420) + koreaHour * 11 + (seed % 17);
  const totalConsults =
    clamp(stats.totalBase, 0, 99999999, 48210) +
    elapsedDays * clamp(stats.dailyGrowth, 0, 9999, 87) +
    today;

  return json({ talking, today, totalConsults });
}

async function hash(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(bytes).slice(0, 4).reduce((acc, byte) => acc * 256 + byte, 0);
}

function toKoreaDateKey(date) {
  const parts = toKoreaDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function toKoreaDateParts(date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23"
  });
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}
