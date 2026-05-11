import { defaultCatalog } from "../data/defaultCatalog";
import type { CatalogData, LiveStats, PublicCatalog, StatsConfig } from "../types";

const LOCAL_CATALOG_KEY = "theblack-homepage.catalog.v1";

export interface SessionState {
  authenticated: boolean;
  localMode: boolean;
}

export async function getPublicCatalog(): Promise<CatalogData> {
  try {
    const response = await fetch("/api/catalog", {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) throw new Error("catalog api unavailable");
    const publicData = (await response.json()) as PublicCatalog;
    return {
      ...defaultCatalog,
      ...publicData,
      stats: defaultCatalog.stats
    };
  } catch {
    return readLocalCatalog() ?? defaultCatalog;
  }
}

export async function getAdminCatalog(): Promise<CatalogData> {
  if (import.meta.env.DEV) {
    return readLocalCatalog() ?? defaultCatalog;
  }

  const response = await fetch("/api/catalog?admin=1", {
    headers: { Accept: "application/json" },
    credentials: "include"
  });

  if (!response.ok) throw new Error("관리자 데이터를 불러오지 못했습니다.");
  return (await response.json()) as CatalogData;
}

export async function saveAdminCatalog(catalog: CatalogData): Promise<CatalogData> {
  const stampedCatalog = {
    ...catalog,
    updatedAt: new Date().toISOString()
  };

  if (import.meta.env.DEV) {
    localStorage.setItem(LOCAL_CATALOG_KEY, JSON.stringify(stampedCatalog));
    return stampedCatalog;
  }

  const response = await fetch("/api/catalog", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    credentials: "include",
    body: JSON.stringify(stampedCatalog)
  });

  if (!response.ok) {
    const error = await safeError(response);
    throw new Error(error || "저장에 실패했습니다.");
  }

  return (await response.json()).catalog as CatalogData;
}

export async function getSession(): Promise<SessionState> {
  if (import.meta.env.DEV) {
    return { authenticated: true, localMode: true };
  }

  try {
    const response = await fetch("/api/session", {
      headers: { Accept: "application/json" },
      credentials: "include"
    });

    if (!response.ok) return { authenticated: false, localMode: false };
    const data = (await response.json()) as { authenticated?: boolean };
    return { authenticated: Boolean(data.authenticated), localMode: false };
  } catch {
    return { authenticated: false, localMode: false };
  }
}

export async function login(password: string): Promise<void> {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ password })
  });

  if (!response.ok) {
    const error = await safeError(response);
    throw new Error(error || "비밀번호를 확인해주세요.");
  }
}

export async function logout(): Promise<void> {
  await fetch("/api/logout", {
    method: "POST",
    credentials: "include"
  });
}

export async function getLiveStats(statsConfig: StatsConfig): Promise<LiveStats> {
  try {
    const response = await fetch("/api/stats", {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) throw new Error("stats api unavailable");
    return (await response.json()) as LiveStats;
  } catch {
    return buildLocalStats(statsConfig);
  }
}

function readLocalCatalog(): CatalogData | null {
  if (typeof localStorage === "undefined") return null;

  try {
    const raw = localStorage.getItem(LOCAL_CATALOG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CatalogData;
  } catch {
    return null;
  }
}

function buildLocalStats(config: StatsConfig): LiveStats {
  const now = new Date();
  const start = new Date(config.startedAt);
  const elapsedDays = Number.isFinite(start.getTime())
    ? Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000))
    : 0;
  const hourLift = now.getHours() * 11 + Math.floor(now.getMinutes() / 10) * 3;
  const talkingRange = Math.max(1, config.talkingMax - config.talkingMin + 1);
  const talking = config.talkingMin + ((now.getMinutes() + now.getHours() * 7) % talkingRange);
  const today = config.todayBase + hourLift;
  const totalConsults = config.totalBase + elapsedDays * config.dailyGrowth + today;

  return { talking, today, totalConsults };
}

async function safeError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? "";
  } catch {
    return "";
  }
}
