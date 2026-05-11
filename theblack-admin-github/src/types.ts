export type TemplateStyle = "basic" | "recommended" | "popular" | "paused" | "event";

export interface SiteSettings {
  channelTalkPluginKey: string;
  kakaoOpenChatUrl: string;
}

export interface HeroContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
}

export interface StatsConfig {
  talkingMin: number;
  talkingMax: number;
  todayBase: number;
  totalBase: number;
  dailyGrowth: number;
  startedAt: string;
}

export interface LiveStats {
  talking: number;
  today: number;
  totalConsults: number;
}

export interface PriceItem {
  id: string;
  name: string;
  unit: string;
  price: string;
  badge: string;
  style: TemplateStyle;
  visible: boolean;
}

export interface PriceSection {
  id: string;
  title: string;
  subtitle: string;
  style: TemplateStyle;
  visible: boolean;
  items: PriceItem[];
}

export interface CatalogData {
  site: SiteSettings;
  hero: HeroContent;
  stats: StatsConfig;
  sections: PriceSection[];
  updatedAt?: string;
}

export type PublicCatalog = Pick<CatalogData, "site" | "hero" | "sections"> & {
  updatedAt?: string;
};
