import "./styles.css";
import { readPriceData } from "./encoded-prices.js";

const LOCAL_DATA_KEY = "theblack-board.prices.v1";
const ADMIN_PATH = location.pathname.startsWith("/admin");
const ADMIN_MODE = import.meta.env.VITE_APP_MODE === "admin" || (import.meta.env.DEV && ADMIN_PATH);

const FALLBACK_DATA = {
  site: {
    brand: "더블랙샵",
    title: "디4 시세표",
    subtitle: "빠르게 확인하고, 필요한 상품은 카톡으로 바로 상담하세요.",
    notice: "저보다 저렴한 곳 있으면 편하게 말씀해주세요.",
    hours: "영업시간: 10:00 - 익일 02:00",
    kakaoOneToOneUrl: "https://open.kakao.com/o/gWbuthWf",
    kakaoGroupUrl: "https://open.kakao.com/o/g8JqBqLg",
    tags: ["대기X출발", "최저가대응", "재고확인", "빠른답변"]
  },
  products: []
};

const app = document.querySelector("#app");
let currentProducts = [];
let adminData = null;
let selectedProductIndex = 0;
let authenticated = false;

init();

async function init() {
  if (ADMIN_MODE) {
    await initAdmin();
    return;
  }

  if (ADMIN_PATH) {
    renderNotFound();
    return;
  }

  installCopyGuards();
  const data = await loadPublicData();
  renderStorefront(data);
}

async function loadPublicData() {
  const fallback = readFallbackData();

  if (import.meta.env.DEV) {
    return mergeData(readLocalData() ?? fallback);
  }

  try {
    const response = await fetch("/api/prices", {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error("prices unavailable");
    return mergeData(await response.json());
  } catch {
    return fallback;
  }
}

async function initAdmin() {
  const session = await getSession();
  authenticated = session.authenticated;

  if (!authenticated) {
    renderLogin();
    return;
  }

  adminData = await loadAdminData();
  renderAdmin();
}

async function getSession() {
  if (import.meta.env.DEV) {
    return { authenticated: true };
  }

  try {
    const response = await fetch("/api/session", {
      credentials: "include",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return { authenticated: false };
    const data = await response.json();
    return { authenticated: Boolean(data.authenticated) };
  } catch {
    return { authenticated: false };
  }
}

async function login(password) {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ password })
  });

  if (!response.ok) throw new Error("비밀번호가 다릅니다.");
}

async function loadAdminData() {
  const fallback = readFallbackData();

  if (import.meta.env.DEV) {
    return mergeData(readLocalData() ?? fallback);
  }

  const response = await fetch("/api/prices?admin=1", {
    headers: { Accept: "application/json" },
    credentials: "include",
    cache: "no-store"
  });
  if (!response.ok) throw new Error("관리자 데이터를 불러오지 못했습니다.");
  return mergeData(await response.json());
}

async function saveAdminData(data) {
  const stampedData = mergeData({
    ...data,
    updatedAt: new Date().toISOString()
  });

  if (import.meta.env.DEV) {
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(stampedData));
    return stampedData;
  }

  const response = await fetch("/api/prices", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    credentials: "include",
    body: JSON.stringify(stampedData)
  });

  if (!response.ok) {
    const error = await safeError(response);
    throw new Error(error || "저장에 실패했습니다.");
  }

  const result = await response.json();
  return mergeData(result.catalog ?? stampedData);
}

function readFallbackData() {
  try {
    return mergeData(readPriceData());
  } catch {
    return mergeData(FALLBACK_DATA);
  }
}

function readLocalData() {
  try {
    const raw = localStorage.getItem(LOCAL_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function mergeData(data) {
  return {
    site: { ...FALLBACK_DATA.site, ...(data?.site || {}) },
    products: Array.isArray(data?.products)
      ? data.products.map((product) => ({
          icon: product.icon ?? "",
          name: product.name ?? "",
          description: product.description ?? "",
          badge: product.badge ?? "",
          visible: product.visible !== false,
          rows: Array.isArray(product.rows)
            ? product.rows.map((row) => ({
                label: row.label ?? "",
                price: row.price ?? ""
              }))
            : []
        }))
      : [],
    updatedAt: data?.updatedAt || ""
  };
}

function installCopyGuards() {
  const guardedSelector = ".hero, .board-meta, .notice, .price-shell, .hours";
  const inputSelector = "input, textarea, [contenteditable='true']";
  const getElement = (target) => (target instanceof Element ? target : target?.parentElement);

  document.addEventListener("copy", (event) => {
    const target = getElement(event.target);
    if (!target?.closest(guardedSelector) || target.closest(inputSelector)) return;
    event.preventDefault();
    event.clipboardData?.setData("text/plain", "");
  });

  document.addEventListener("contextmenu", (event) => {
    const target = getElement(event.target);
    if (!target?.closest(guardedSelector) || target.closest(inputSelector)) return;
    event.preventDefault();
  });

  document.addEventListener("dragstart", (event) => {
    const target = getElement(event.target);
    if (target?.closest(guardedSelector)) event.preventDefault();
  });
}

function renderStorefront(data) {
  currentProducts = data.products.filter((product) => product.visible !== false);
  app.innerHTML = storefrontHtml(data);

  const search = document.querySelector("#search");
  const cards = document.querySelector("#cards");
  const empty = document.querySelector("#empty");

  renderCards(cards, empty, currentProducts);
  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    const filtered = currentProducts.filter((product) =>
      [product.name, product.description, product.badge, ...product.rows.flatMap((row) => [row.label, row.price])]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
    renderCards(cards, empty, filtered);
  });
}

function storefrontHtml(data, options = {}) {
  const today = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date());
  const updatedAt = data.updatedAt
    ? new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(data.updatedAt))
    : new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date());
  const talking = buildTalkingCount();
  const products = data.products.filter((product) => product.visible !== false);

  return `
    <main class="page ${options.preview ? "preview-page" : ""}">
      <section class="hero">
        <div class="brand-row">
          <div class="brand">
            <img src="/logo.png" alt="" />
            <div>
              <strong>${escapeHtml(data.site.brand)}</strong>
              <span>${escapeHtml(data.site.title)}</span>
            </div>
          </div>
          <div class="live-pill">
            <span>현재 상담중</span>
            <strong class="pulse">${talking}명</strong>
          </div>
        </div>
        <div class="trust-grid">
          ${data.site.tags
            .slice(0, 4)
            .map(
              (tag, index) => `
                <span class="trust-item trust-${index + 1}">
                  <i aria-hidden="true"></i>
                  <em>${escapeHtml(tag)}</em>
                </span>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="board-meta">
        <div>
          <span class="date-label">TODAY PRICE</span>
          <h2>${today} 시세표</h2>
        </div>
        <span class="update-chip">최근 반영 ${updatedAt}</span>
      </section>

      <section class="notice">
        <span>공지</span>
        <p>${escapeHtml(data.site.notice)}</p>
      </section>

      <section class="price-shell">
        ${
          options.preview
            ? ""
            : `<div class="tools">
                <input class="search" id="search" type="search" placeholder="상품 검색" aria-label="상품 검색" />
              </div>`
        }
        <div class="cards" id="${options.preview ? "preview-cards" : "cards"}">${options.preview ? cardsHtml(products) : ""}</div>
        <div class="empty" id="${options.preview ? "preview-empty" : "empty"}">검색 결과가 없습니다.</div>
      </section>

      <p class="hours">${escapeHtml(data.site.hours)}</p>

      ${
        options.preview
          ? ""
          : `<div class="sticky-actions">
              <a href="${escapeAttribute(data.site.kakaoOneToOneUrl)}" target="_blank" rel="noopener noreferrer">1:1 톡</a>
              <a href="${escapeAttribute(data.site.kakaoGroupUrl)}" target="_blank" rel="noopener noreferrer">단톡방</a>
            </div>`
      }
    </main>
  `;
}

function renderCards(cards, empty, products) {
  cards.innerHTML = cardsHtml(products);
  empty.classList.toggle("visible", products.length === 0);
}

function cardsHtml(products) {
  return products
    .map(
      (product) => `
        <article class="card">
          <div class="card-head">
            <div>
              <h3>${escapeHtml(product.icon || "")} ${escapeHtml(product.name)}</h3>
              <p>${escapeHtml(product.description || "")}</p>
            </div>
            ${product.badge ? `<span class="badge">${escapeHtml(product.badge)}</span>` : ""}
          </div>
          <div class="rows">
            ${product.rows
              .map(
                (row) => `
                  <div class="price-row">
                    <span>${escapeHtml(row.label)}</span>
                    <b>${escapeHtml(row.price)}</b>
                  </div>
                `
              )
              .join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function renderLogin(message = "") {
  app.innerHTML = `
    <main class="admin-login">
      <form class="login-box" id="login-form">
        <img src="/logo.png" alt="" />
        <h1>관리자 로그인</h1>
        <p>가격표를 수정하려면 비밀번호를 입력해주세요.</p>
        <input id="admin-password" type="password" autocomplete="current-password" placeholder="비밀번호" />
        ${message ? `<div class="login-error">${escapeHtml(message)}</div>` : ""}
        <button type="submit">로그인</button>
      </form>
    </main>
  `;

  document.querySelector("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.querySelector("#admin-password").value;
    try {
      await login(password);
      authenticated = true;
      adminData = await loadAdminData();
      renderAdmin();
    } catch (error) {
      renderLogin(error.message || "비밀번호가 다릅니다.");
    }
  });
}

function renderNotFound() {
  app.innerHTML = `
    <main class="admin-login">
      <div class="login-box">
        <img src="/logo.png" alt="" />
        <h1>페이지를 찾을 수 없습니다.</h1>
        <p>관리자 페이지는 관리자 전용 도메인에서만 열립니다.</p>
      </div>
    </main>
  `;
}

function renderAdmin(status = "") {
  const product = adminData.products[selectedProductIndex] ?? adminData.products[0] ?? createProduct();
  if (!adminData.products.length) adminData.products.push(product);
  selectedProductIndex = Math.max(0, Math.min(selectedProductIndex, adminData.products.length - 1));

  app.innerHTML = `
    <main class="admin-app">
      <aside class="admin-sidebar">
        <div class="admin-brand">
          <img src="/logo.png" alt="" />
          <div>
            <strong>더블랙샵 관리자</strong>
            <span>${import.meta.env.DEV ? "로컬 편집 모드" : "운영 편집 모드"}</span>
          </div>
        </div>
        <button class="admin-add" data-action="add-product">+ 상품 추가</button>
        <div class="admin-list">
          ${adminData.products
            .map(
              (item, index) => `
                <button class="${index === selectedProductIndex ? "active" : ""}" data-action="select-product" data-index="${index}">
                  <span>${escapeHtml(item.name || "새 상품")}</span>
                  <small>${item.visible === false ? "숨김" : escapeHtml(item.badge || "노출")}</small>
                </button>
              `
            )
            .join("")}
        </div>
      </aside>

      <section class="admin-preview">
        <div class="admin-toolbar">
          <div>
            <strong>미리보기</strong>
            <span>저장 전 화면을 바로 확인할 수 있어요.</span>
          </div>
          <button data-action="save">저장</button>
        </div>
        <div class="admin-preview-frame" id="admin-preview-frame">
          ${storefrontHtml(adminData, { preview: true })}
        </div>
      </section>

      <aside class="admin-editor">
        <div class="editor-status">${status ? escapeHtml(status) : "상품을 고르고 내용을 수정하세요."}</div>
        <details open>
          <summary>상단/공지 수정</summary>
          ${siteField("brand", "상호명")}
          ${siteField("title", "작은 제목")}
          ${siteField("notice", "공지")}
          ${siteField("hours", "영업시간")}
          ${siteField("kakaoOneToOneUrl", "1:1 오픈톡 주소")}
          ${siteField("kakaoGroupUrl", "단톡방 주소")}
          ${[0, 1, 2, 3]
            .map((index) => tagField(index, `강점 ${index + 1}`))
            .join("")}
        </details>

        <details open>
          <summary>선택 상품 수정</summary>
          <div class="editor-actions">
            <button data-action="move-up">위로</button>
            <button data-action="move-down">아래로</button>
            <button data-action="toggle-visible">${product.visible === false ? "노출하기" : "숨기기"}</button>
            <button class="danger" data-action="delete-product">삭제</button>
          </div>
          ${productField("icon", "아이콘")}
          ${productField("name", "상품명")}
          ${productField("description", "설명", "textarea")}
          ${productField("badge", "배지")}
          <div class="row-editor">
            <div class="row-editor-head">
              <strong>가격 줄</strong>
              <button data-action="add-row">+ 줄 추가</button>
            </div>
            ${product.rows
              .map(
                (row, index) => `
                  <div class="row-edit">
                    <input data-row="${index}" data-key="label" value="${escapeAttribute(row.label)}" placeholder="수량/단위" />
                    <input data-row="${index}" data-key="price" value="${escapeAttribute(row.price)}" placeholder="가격" />
                    <button data-action="delete-row" data-row="${index}" ${product.rows.length <= 1 ? "disabled" : ""}>삭제</button>
                  </div>
                `
              )
              .join("")}
          </div>
        </details>
      </aside>
    </main>
  `;

  bindAdminEvents();
}

function siteField(key, label) {
  return `
    <label class="field">
      <span>${label}</span>
      <input data-scope="site" data-key="${key}" value="${escapeAttribute(adminData.site[key] || "")}" />
    </label>
  `;
}

function tagField(index, label) {
  return `
    <label class="field">
      <span>${label}</span>
      <input data-scope="tag" data-index="${index}" value="${escapeAttribute(adminData.site.tags[index] || "")}" />
    </label>
  `;
}

function productField(key, label, type = "input") {
  const product = adminData.products[selectedProductIndex];
  const value = escapeAttribute(product[key] || "");
  if (type === "textarea") {
    return `
      <label class="field">
        <span>${label}</span>
        <textarea data-scope="product" data-key="${key}" rows="3">${escapeHtml(product[key] || "")}</textarea>
      </label>
    `;
  }

  return `
    <label class="field">
      <span>${label}</span>
      <input data-scope="product" data-key="${key}" value="${value}" />
    </label>
  `;
}

function bindAdminEvents() {
  document.querySelector(".admin-app").addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) return;

    if (target.dataset.scope === "site") {
      adminData.site[target.dataset.key] = target.value;
    } else if (target.dataset.scope === "tag") {
      adminData.site.tags[Number(target.dataset.index)] = target.value;
    } else if (target.dataset.scope === "product") {
      adminData.products[selectedProductIndex][target.dataset.key] = target.value;
    } else if (target.dataset.row) {
      adminData.products[selectedProductIndex].rows[Number(target.dataset.row)][target.dataset.key] = target.value;
    }

    refreshAdminPreview();
  });

  document.querySelector(".admin-app").addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const action = button.dataset.action;
    const index = Number(button.dataset.index);
    const product = adminData.products[selectedProductIndex];

    if (action === "select-product") {
      selectedProductIndex = index;
      renderAdmin();
    }
    if (action === "add-product") {
      adminData.products.push(createProduct());
      selectedProductIndex = adminData.products.length - 1;
      renderAdmin("새 상품을 추가했습니다.");
    }
    if (action === "delete-product" && adminData.products.length > 1) {
      adminData.products.splice(selectedProductIndex, 1);
      selectedProductIndex = Math.max(0, selectedProductIndex - 1);
      renderAdmin("상품을 삭제했습니다.");
    }
    if (action === "toggle-visible") {
      product.visible = product.visible === false;
      renderAdmin(product.visible ? "상품을 노출했습니다." : "상품을 숨겼습니다.");
    }
    if (action === "move-up" && selectedProductIndex > 0) {
      swapProducts(selectedProductIndex, selectedProductIndex - 1);
      selectedProductIndex -= 1;
      renderAdmin("순서를 올렸습니다.");
    }
    if (action === "move-down" && selectedProductIndex < adminData.products.length - 1) {
      swapProducts(selectedProductIndex, selectedProductIndex + 1);
      selectedProductIndex += 1;
      renderAdmin("순서를 내렸습니다.");
    }
    if (action === "add-row") {
      product.rows.push({ label: "", price: "" });
      renderAdmin("가격 줄을 추가했습니다.");
    }
    if (action === "delete-row") {
      product.rows.splice(Number(button.dataset.row), 1);
      renderAdmin("가격 줄을 삭제했습니다.");
    }
    if (action === "save") {
      try {
        adminData = await saveAdminData(adminData);
        renderAdmin(import.meta.env.DEV ? "로컬에 저장했습니다. 손님용 화면을 새로고침하면 반영됩니다." : "저장했습니다. 손님용 페이지에 반영됩니다.");
      } catch (error) {
        renderAdmin(error.message || "저장에 실패했습니다.");
      }
    }
  });
}

function refreshAdminPreview() {
  const frame = document.querySelector("#admin-preview-frame");
  if (frame) frame.innerHTML = storefrontHtml(adminData, { preview: true });
}

function createProduct() {
  return {
    icon: "⭐",
    name: "새 상품",
    description: "",
    badge: "",
    visible: true,
    rows: [{ label: "1개", price: "가격 문의" }]
  };
}

function swapProducts(a, b) {
  const temp = adminData.products[a];
  adminData.products[a] = adminData.products[b];
  adminData.products[b] = temp;
}

function buildTalkingCount() {
  const now = new Date();
  return 3 + ((now.getHours() * 7 + now.getMinutes()) % 6);
}

async function safeError(response) {
  try {
    const data = await response.json();
    return data.error || "";
  } catch {
    return "";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
