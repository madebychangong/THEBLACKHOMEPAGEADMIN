import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Crown,
  Eye,
  EyeOff,
  Gem,
  LogOut,
  MessageCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2
} from "lucide-react";
import { defaultCatalog } from "./data/defaultCatalog";
import {
  getAdminCatalog,
  getLiveStats,
  getPublicCatalog,
  getSession,
  login,
  logout,
  saveAdminCatalog
} from "./services/api";
import type { CatalogData, LiveStats, PriceItem, PriceSection, TemplateStyle } from "./types";

const styleMeta: Record<TemplateStyle, { label: string; tone: string }> = {
  basic: { label: "기본", tone: "정돈된 기본 가격" },
  recommended: { label: "추천 강조", tone: "상담 유도 상품" },
  popular: { label: "인기 상품", tone: "조회가 많은 상품" },
  paused: { label: "품절/중지", tone: "잠시 중단된 상품" },
  event: { label: "이벤트 가격", tone: "한정/할인 상품" }
};

const styleOptions = Object.keys(styleMeta) as TemplateStyle[];

export default function App() {
  const appMode = import.meta.env.VITE_APP_MODE;
  const isAdminRoute =
    appMode === "admin" ||
    (appMode !== "public" &&
      (Boolean(window.__THEBLACK_ADMIN_HOST__) || window.location.pathname.startsWith("/admin")));
  return isAdminRoute ? <AdminEditor /> : <PublicHome />;
}

function PublicHome() {
  const [catalog, setCatalog] = useState<CatalogData>(defaultCatalog);
  const [stats, setStats] = useState<LiveStats>({
    talking: defaultCatalog.stats.talkingMin,
    today: defaultCatalog.stats.todayBase,
    totalConsults: defaultCatalog.stats.totalBase
  });

  useEffect(() => {
    let mounted = true;

    getPublicCatalog().then((data) => {
      if (!mounted) return;
      setCatalog(data);
      getLiveStats(data.stats).then((nextStats) => mounted && setStats(nextStats));
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      getLiveStats(catalog.stats).then(setStats);
    }, 14_000);

    return () => window.clearInterval(timer);
  }, [catalog.stats]);

  useEffect(() => {
    bootChannelTalk(catalog.site.channelTalkPluginKey);
  }, [catalog.site.channelTalkPluginKey]);

  return <PublicLanding catalog={catalog} stats={stats} />;
}

function PublicLanding({
  catalog,
  stats,
  preview = false
}: {
  catalog: CatalogData;
  stats: LiveStats;
  preview?: boolean;
}) {
  const [activeSection, setActiveSection] = useState("all");
  const [query, setQuery] = useState("");

  const visibleSections = useMemo(
    () =>
      catalog.sections
        .filter((section) => section.visible)
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.visible)
        }))
        .filter((section) => section.items.length > 0),
    [catalog.sections]
  );

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return visibleSections
      .filter((section) => activeSection === "all" || section.id === activeSection)
      .map((section) => {
        if (!normalizedQuery) return section;
        return {
          ...section,
          items: section.items.filter((item) =>
            [section.title, section.subtitle, item.name, item.unit, item.price, item.badge]
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery)
          )
        };
      })
      .filter((section) => section.items.length > 0);
  }, [activeSection, query, visibleSections]);

  useEffect(() => {
    if (activeSection === "all") return;
    if (!visibleSections.some((section) => section.id === activeSection)) {
      setActiveSection("all");
    }
  }, [activeSection, visibleSections]);

  const openChannel = () => {
    if (preview) return;
    if (window.ChannelIO) {
      window.ChannelIO("showMessenger");
      return;
    }
    if (catalog.site.kakaoOpenChatUrl) {
      window.open(catalog.site.kakaoOpenChatUrl, "_blank", "noopener,noreferrer");
    }
  };

  const openKakao = () => {
    if (preview || !catalog.site.kakaoOpenChatUrl) return;
    window.open(catalog.site.kakaoOpenChatUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <main className={preview ? "site-shell preview-shell" : "site-shell"}>
      <section className="hero-section">
        <img className="hero-image" src="/hero-blackshop.png" alt="" aria-hidden="true" />
        <div className="hero-shade" />
        <header className="topbar">
          <a className="brand" href="/">
            <span className="brand-mark">
              <img src="/logo.png" alt="" />
            </span>
            <span>THE BLACK SHOP</span>
          </a>
          <nav className="top-actions" aria-label="상담 링크">
            <button className="ghost-button" type="button" onClick={openKakao}>
              <MessageCircle size={17} />
              카카오
            </button>
            <button className="solid-button" type="button" onClick={openChannel}>
              <ShieldCheck size={17} />
              상담
            </button>
          </nav>
        </header>

        <div className="hero-content">
          <div className="eyebrow">
            <Sparkles size={16} />
            {catalog.hero.eyebrow}
          </div>
          <h1>{catalog.hero.title}</h1>
          <p>{catalog.hero.subtitle}</p>
          <div className="hero-buttons">
            <button className="primary-cta" type="button" onClick={openChannel}>
              <MessageCircle size={19} />
              {catalog.hero.primaryCta}
            </button>
            <button className="secondary-cta" type="button" onClick={openKakao}>
              <BadgeCheck size={18} />
              {catalog.hero.secondaryCta}
            </button>
          </div>
        </div>
      </section>

      <section className="stats-band" aria-label="상담 현황">
        <StatItem label="현재 상담" value={stats.talking.toLocaleString()} unit="명" live />
        <StatItem label="오늘 문의" value={stats.today.toLocaleString()} unit="건" />
        <StatItem label="누적 상담" value={stats.totalConsults.toLocaleString()} unit="건" />
      </section>

      <section className="price-section" id="prices">
        <div className="section-heading">
          <div>
            <p className="section-kicker">PRICE BOARD</p>
            <h2>실시간 가격표</h2>
          </div>
          <div className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="상품 검색"
              aria-label="상품 검색"
            />
          </div>
        </div>

        <div className="category-tabs" aria-label="가격표 카테고리">
          <button
            className={activeSection === "all" ? "active" : ""}
            type="button"
            onClick={() => setActiveSection("all")}
          >
            전체
          </button>
          {visibleSections.map((section) => (
            <button
              key={section.id}
              className={activeSection === section.id ? "active" : ""}
              type="button"
              onClick={() => setActiveSection(section.id)}
            >
              {section.title}
            </button>
          ))}
        </div>

        <div className="price-grid">
          {filteredSections.map((section) => (
            <PriceSectionView key={section.id} section={section} />
          ))}
        </div>
      </section>

    </main>
  );
}

function StatItem({
  label,
  value,
  unit,
  live = false
}: {
  label: string;
  value: string;
  unit: string;
  live?: boolean;
}) {
  return (
    <div className="stat-item">
      <span className={live ? "stat-pulse" : "stat-icon"} />
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      <span className="stat-unit">{unit}</span>
    </div>
  );
}

function PriceSectionView({ section }: { section: PriceSection }) {
  return (
    <article className={`price-card tone-${section.style}`}>
      <div className="price-card-head">
        <div>
          <p>{styleMeta[section.style].label}</p>
          <h3>{section.title}</h3>
          <span>{section.subtitle}</span>
        </div>
        <Crown size={22} />
      </div>
      <div className="price-rows">
        {section.items.map((item) => (
          <div className={`price-row tone-${item.style}`} key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <span>{item.unit}</span>
            </div>
            <div className="price-row-right">
              {item.badge && <em>{item.badge}</em>}
              <b>{item.price}</b>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function AdminEditor() {
  const [catalog, setCatalog] = useState<CatalogData>(defaultCatalog);
  const [stats, setStats] = useState<LiveStats>({
    talking: defaultCatalog.stats.talkingMin,
    today: defaultCatalog.stats.todayBase,
    totalConsults: defaultCatalog.stats.totalBase
  });
  const [selectedKey, setSelectedKey] = useState("hero");
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [localMode, setLocalMode] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    getSession()
      .then(async (session) => {
        if (!mounted) return;
        setAuthenticated(session.authenticated);
        setLocalMode(session.localMode);

        if (session.authenticated) {
          const data = await getAdminCatalog();
          if (!mounted) return;
          setCatalog(data);
          setSelectedKey(data.sections[0]?.id ?? "hero");
          setStats(await getLiveStats(data.stats));
        }
      })
      .finally(() => mounted && setChecking(false));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    getLiveStats(catalog.stats).then(setStats);
  }, [catalog.stats]);

  const selectedSection = catalog.sections.find((section) => section.id === selectedKey);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    try {
      await login(password);
      const data = await getAdminCatalog();
      setCatalog(data);
      setSelectedKey(data.sections[0]?.id ?? "hero");
      setAuthenticated(true);
      setPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    }
  };

  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const saved = await saveAdminCatalog(catalog);
      setCatalog(saved);
      setMessage("저장되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    const section: PriceSection = {
      id: makeId("section"),
      title: "새 가격 섹션",
      subtitle: "소제목을 입력하세요",
      style: "basic",
      visible: true,
      items: [
        {
          id: makeId("item"),
          name: "새 상품",
          unit: "단위",
          price: "0원",
          badge: "",
          style: "basic",
          visible: true
        }
      ]
    };

    setCatalog((current) => ({ ...current, sections: [...current.sections, section] }));
    setSelectedKey(section.id);
  };

  const deleteSection = (sectionId: string) => {
    if (!window.confirm("이 가격 섹션을 삭제할까요?")) return;
    setCatalog((current) => {
      const nextSections = current.sections.filter((section) => section.id !== sectionId);
      setSelectedKey(nextSections[0]?.id ?? "hero");
      return { ...current, sections: nextSections };
    });
  };

  const moveSection = (sectionId: string, direction: -1 | 1) => {
    setCatalog((current) => {
      const sections = [...current.sections];
      const index = sections.findIndex((section) => section.id === sectionId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= sections.length) return current;
      const [section] = sections.splice(index, 1);
      sections.splice(nextIndex, 0, section);
      return { ...current, sections };
    });
  };

  const updateSection = (sectionId: string, patch: Partial<PriceSection>) => {
    setCatalog((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      )
    }));
  };

  const updateItem = (sectionId: string, itemId: string, patch: Partial<PriceItem>) => {
    setCatalog((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item
              )
            }
          : section
      )
    }));
  };

  const addItem = (sectionId: string) => {
    const item: PriceItem = {
      id: makeId("item"),
      name: "새 상품",
      unit: "단위",
      price: "0원",
      badge: "",
      style: "basic",
      visible: true
    };

    setCatalog((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? { ...section, items: [...section.items, item] } : section
      )
    }));
  };

  const deleteItem = (sectionId: string, itemId: string) => {
    setCatalog((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId
          ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
          : section
      )
    }));
  };

  const moveItem = (sectionId: string, itemId: string, direction: -1 | 1) => {
    setCatalog((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const items = [...section.items];
        const index = items.findIndex((item) => item.id === itemId);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return section;
        const [item] = items.splice(index, 1);
        items.splice(nextIndex, 0, item);
        return { ...section, items };
      })
    }));
  };

  if (checking) {
    return (
      <div className="admin-login-screen">
        <div className="login-panel">
          <Gem size={28} />
          <p>관리자 화면을 불러오는 중입니다.</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="admin-login-screen">
        <form className="login-panel" onSubmit={handleLogin}>
          <div className="login-mark">
            <img src="/logo.png" alt="" />
          </div>
          <h1>THE BLACK SHOP</h1>
          <p>관리자 비밀번호를 입력하세요.</p>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="비밀번호"
            autoComplete="current-password"
          />
          {message && <span className="form-message error">{message}</span>}
          <button className="primary-cta wide" type="submit">
            <ShieldCheck size={18} />
            로그인
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <a className="brand admin-brand" href="/">
          <span className="brand-mark">
            <img src="/logo.png" alt="" />
          </span>
          <span>관리자</span>
        </a>
        {localMode && <span className="local-badge">로컬 미리보기</span>}

        <button
          className={selectedKey === "hero" ? "admin-nav active" : "admin-nav"}
          type="button"
          onClick={() => setSelectedKey("hero")}
        >
          첫 화면 / 버튼
        </button>
        <button
          className={selectedKey === "stats" ? "admin-nav active" : "admin-nav"}
          type="button"
          onClick={() => setSelectedKey("stats")}
        >
          상담 수치
        </button>

        <div className="admin-nav-title">가격표</div>
        {catalog.sections.map((section, index) => (
          <button
            key={section.id}
            className={selectedKey === section.id ? "admin-nav active" : "admin-nav"}
            type="button"
            onClick={() => setSelectedKey(section.id)}
          >
            <span>{section.title}</span>
            {section.visible ? <Eye size={15} /> : <EyeOff size={15} />}
            <span className="index-pill">{index + 1}</span>
          </button>
        ))}
        <button className="add-section-button" type="button" onClick={addSection}>
          <Plus size={17} />
          섹션 추가
        </button>
      </aside>

      <section className="admin-preview">
        <div className="admin-toolbar">
          <div>
            <strong>미리보기</strong>
            <span>저장 전 화면을 바로 확인합니다.</span>
          </div>
          <div className="toolbar-actions">
            {message && <span className="form-message">{message}</span>}
            <button className="ghost-button dark" type="button" onClick={handleLogout}>
              <LogOut size={17} />
              로그아웃
            </button>
            <button className="solid-button" type="button" onClick={handleSave} disabled={saving}>
              <Save size={17} />
              {saving ? "저장 중" : "저장"}
            </button>
          </div>
        </div>
        <div className="preview-frame">
          <PublicLanding catalog={catalog} stats={stats} preview />
        </div>
      </section>

      <aside className="editor-panel">
        {selectedKey === "hero" && (
          <HeroEditor
            catalog={catalog}
            onChange={(patch) =>
              setCatalog((current) => ({
                ...current,
                ...patch,
                hero: { ...current.hero, ...(patch.hero ?? {}) },
                site: { ...current.site, ...(patch.site ?? {}) }
              }))
            }
          />
        )}
        {selectedKey === "stats" && (
          <StatsEditor
            catalog={catalog}
            onChange={(statsConfig) =>
              setCatalog((current) => ({ ...current, stats: { ...current.stats, ...statsConfig } }))
            }
          />
        )}
        {selectedSection && (
          <SectionEditor
            section={selectedSection}
            onChange={(patch) => updateSection(selectedSection.id, patch)}
            onDelete={() => deleteSection(selectedSection.id)}
            onMove={(direction) => moveSection(selectedSection.id, direction)}
            onAddItem={() => addItem(selectedSection.id)}
            onUpdateItem={(itemId, patch) => updateItem(selectedSection.id, itemId, patch)}
            onDeleteItem={(itemId) => deleteItem(selectedSection.id, itemId)}
            onMoveItem={(itemId, direction) => moveItem(selectedSection.id, itemId, direction)}
          />
        )}
      </aside>
    </div>
  );
}

function HeroEditor({
  catalog,
  onChange
}: {
  catalog: CatalogData;
  onChange: (patch: Partial<CatalogData>) => void;
}) {
  return (
    <div className="editor-stack">
      <PanelTitle title="첫 화면 / 상담 버튼" caption="브랜드 문구와 상담 연결을 관리합니다." />
      <TextField
        label="상단 라벨"
        value={catalog.hero.eyebrow}
        onChange={(eyebrow) => onChange({ hero: { ...catalog.hero, eyebrow } })}
      />
      <TextField
        label="큰 제목"
        value={catalog.hero.title}
        onChange={(title) => onChange({ hero: { ...catalog.hero, title } })}
      />
      <TextArea
        label="소개 문구"
        value={catalog.hero.subtitle}
        onChange={(subtitle) => onChange({ hero: { ...catalog.hero, subtitle } })}
      />
      <TextField
        label="메인 버튼"
        value={catalog.hero.primaryCta}
        onChange={(primaryCta) => onChange({ hero: { ...catalog.hero, primaryCta } })}
      />
      <TextField
        label="보조 버튼"
        value={catalog.hero.secondaryCta}
        onChange={(secondaryCta) => onChange({ hero: { ...catalog.hero, secondaryCta } })}
      />
      <TextField
        label="채널톡 플러그인 키"
        value={catalog.site.channelTalkPluginKey}
        onChange={(channelTalkPluginKey) =>
          onChange({ site: { ...catalog.site, channelTalkPluginKey } })
        }
      />
      <TextField
        label="카카오 오픈채팅 주소"
        value={catalog.site.kakaoOpenChatUrl}
        onChange={(kakaoOpenChatUrl) => onChange({ site: { ...catalog.site, kakaoOpenChatUrl } })}
      />
      <button
        className="reset-channel-button"
        type="button"
        onClick={() => resetChannelTalkLocalData(catalog.site.channelTalkPluginKey)}
      >
        <RefreshCw size={16} />
        채널톡 테스트 초기화
      </button>
    </div>
  );
}

function StatsEditor({
  catalog,
  onChange
}: {
  catalog: CatalogData;
  onChange: (stats: Partial<CatalogData["stats"]>) => void;
}) {
  return (
    <div className="editor-stack">
      <PanelTitle title="상담 수치" caption="방문자 화면에는 계산된 숫자만 표시됩니다." />
      <NumberField
        label="현재 상담 최소"
        value={catalog.stats.talkingMin}
        onChange={(talkingMin) => onChange({ talkingMin })}
      />
      <NumberField
        label="현재 상담 최대"
        value={catalog.stats.talkingMax}
        onChange={(talkingMax) => onChange({ talkingMax })}
      />
      <NumberField
        label="오늘 문의 기준"
        value={catalog.stats.todayBase}
        onChange={(todayBase) => onChange({ todayBase })}
      />
      <NumberField
        label="누적 상담 기준"
        value={catalog.stats.totalBase}
        onChange={(totalBase) => onChange({ totalBase })}
      />
      <NumberField
        label="하루 증가폭"
        value={catalog.stats.dailyGrowth}
        onChange={(dailyGrowth) => onChange({ dailyGrowth })}
      />
      <TextField
        label="기준 시작일"
        value={catalog.stats.startedAt}
        onChange={(startedAt) => onChange({ startedAt })}
      />
    </div>
  );
}

function SectionEditor({
  section,
  onChange,
  onDelete,
  onMove,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onMoveItem
}: {
  section: PriceSection;
  onChange: (patch: Partial<PriceSection>) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onAddItem: () => void;
  onUpdateItem: (itemId: string, patch: Partial<PriceItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onMoveItem: (itemId: string, direction: -1 | 1) => void;
}) {
  return (
    <div className="editor-stack">
      <PanelTitle title="가격 섹션" caption="섹션과 상품 행을 수정합니다." />
      <div className="editor-actions-row">
        <IconButton label="위로" onClick={() => onMove(-1)}>
          <ArrowUp size={16} />
        </IconButton>
        <IconButton label="아래로" onClick={() => onMove(1)}>
          <ArrowDown size={16} />
        </IconButton>
        <IconButton label="삭제" danger onClick={onDelete}>
          <Trash2 size={16} />
        </IconButton>
      </div>
      <ToggleField
        label="섹션 노출"
        checked={section.visible}
        onChange={(visible) => onChange({ visible })}
      />
      <TextField label="제목" value={section.title} onChange={(title) => onChange({ title })} />
      <TextField
        label="소제목"
        value={section.subtitle}
        onChange={(subtitle) => onChange({ subtitle })}
      />
      <StyleSelect
        label="섹션 템플릿"
        value={section.style}
        onChange={(style) => onChange({ style })}
      />

      <div className="items-heading">
        <strong>상품 행</strong>
        <button className="mini-solid-button" type="button" onClick={onAddItem}>
          <Plus size={15} />
          추가
        </button>
      </div>

      {section.items.map((item, index) => (
        <div className="item-editor" key={item.id}>
          <div className="item-editor-head">
            <span>#{index + 1}</span>
            <div>
              <IconButton label="위로" onClick={() => onMoveItem(item.id, -1)}>
                <ArrowUp size={15} />
              </IconButton>
              <IconButton label="아래로" onClick={() => onMoveItem(item.id, 1)}>
                <ArrowDown size={15} />
              </IconButton>
              <IconButton label="삭제" danger onClick={() => onDeleteItem(item.id)}>
                <Trash2 size={15} />
              </IconButton>
            </div>
          </div>
          <ToggleField
            label="상품 노출"
            checked={item.visible}
            onChange={(visible) => onUpdateItem(item.id, { visible })}
          />
          <TextField
            label="상품명"
            value={item.name}
            onChange={(name) => onUpdateItem(item.id, { name })}
          />
          <TextField
            label="단위/설명"
            value={item.unit}
            onChange={(unit) => onUpdateItem(item.id, { unit })}
          />
          <TextField
            label="가격"
            value={item.price}
            onChange={(price) => onUpdateItem(item.id, { price })}
          />
          <TextField
            label="배지"
            value={item.badge}
            onChange={(badge) => onUpdateItem(item.id, { badge })}
          />
          <StyleSelect
            label="상품 템플릿"
            value={item.style}
            onChange={(style) => onUpdateItem(item.id, { style })}
          />
        </div>
      ))}
    </div>
  );
}

function PanelTitle({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
      <p>{caption}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        value={value}
        type="number"
        min={0}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
      />
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="toggle-field">
      <span>{label}</span>
      <input checked={checked} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function StyleSelect({
  label,
  value,
  onChange
}: {
  label: string;
  value: TemplateStyle;
  onChange: (value: TemplateStyle) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as TemplateStyle)}>
        {styleOptions.map((style) => (
          <option key={style} value={style}>
            {styleMeta[style].label} - {styleMeta[style].tone}
          </option>
        ))}
      </select>
    </label>
  );
}

function IconButton({
  label,
  children,
  danger = false,
  onClick
}: {
  label: string;
  children: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={danger ? "icon-button danger" : "icon-button"}
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function bootChannelTalk(pluginKey: string) {
  if (!pluginKey || typeof window === "undefined") return;

  const alreadyLoaded = Boolean(window.ChannelIO);

  if (!window.ChannelIO) {
    const channel = function (...args: unknown[]) {
      (channel.q = channel.q || []).push(args);
    } as ((...args: unknown[]) => void) & { q?: unknown[][] };
    channel.q = [];
    window.ChannelIO = channel;
  }

  if (!window.ChannelIOInitialized) {
    window.ChannelIOInitialized = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://cdn.channel.io/plugin/ch-plugin-web.js";
    document.head.appendChild(script);
  }

  if (alreadyLoaded) {
    window.ChannelIO("shutdown");
  }
  window.ChannelIO("boot", { pluginKey });
}

function resetChannelTalkLocalData(pluginKey: string) {
  if (typeof window === "undefined") return;

  try {
    window.ChannelIO?.("hideMessenger");
    window.ChannelIO?.("shutdown");
    clearChannelTalkStorage(localStorage);
    clearChannelTalkStorage(sessionStorage);
    clearChannelTalkCookies();
    window.ChannelIO?.("boot", { pluginKey });
    window.alert("이 브라우저의 채널톡 테스트 데이터를 초기화했습니다. 상담창을 다시 열어 확인해주세요.");
  } catch {
    window.alert("초기화 중 문제가 있었습니다. 시크릿 창에서도 한 번 확인해주세요.");
  }
}

function clearChannelTalkStorage(storage: Storage) {
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
    (key): key is string => Boolean(key)
  );

  keys.forEach((key) => {
    const normalized = key.toLowerCase();
    if (
      normalized === "ch-veil-id" ||
      normalized.startsWith("ch-") ||
      normalized.includes("channelio") ||
      normalized.includes("channel-talk")
    ) {
      storage.removeItem(key);
    }
  });
}

function clearChannelTalkCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (!name) return;
    const normalized = name.toLowerCase();
    if (!normalized.startsWith("ch-") && !normalized.includes("channel")) return;
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  });
}
