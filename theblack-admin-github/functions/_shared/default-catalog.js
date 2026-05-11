export const defaultCatalog = {
  site: {
    channelTalkPluginKey: "bffeea9d-b602-4f82-9627-c016d84014c6",
    kakaoOpenChatUrl: "https://open.kakao.com/o/gWbuthWf"
  },
  hero: {
    eyebrow: "PREMIUM ITEM DESK",
    title: "THE BLACK SHOP",
    subtitle: "빠른 응대, 선명한 가격표, 검증된 상담 흐름으로 필요한 상품을 조용하고 정확하게 안내합니다.",
    primaryCta: "채널톡 상담",
    secondaryCta: "카카오 오픈채팅"
  },
  stats: {
    talkingMin: 3,
    talkingMax: 8,
    todayBase: 420,
    totalBase: 48210,
    dailyGrowth: 87,
    startedAt: "2026-05-01"
  },
  sections: [
    {
      id: "currency",
      title: "재화",
      subtitle: "거래량이 많은 기본 상품",
      style: "popular",
      visible: true,
      items: [
        {
          id: "gold-100",
          name: "골드 100만",
          unit: "즉시 상담",
          price: "5,000원",
          badge: "인기",
          style: "popular",
          visible: true
        },
        {
          id: "gold-300",
          name: "골드 300만",
          unit: "묶음 할인",
          price: "13,000원",
          badge: "추천",
          style: "recommended",
          visible: true
        },
        {
          id: "gold-500",
          name: "골드 500만",
          unit: "대량 문의 가능",
          price: "21,000원",
          badge: "",
          style: "basic",
          visible: true
        }
      ]
    },
    {
      id: "entry",
      title: "입장권 / 보석",
      subtitle: "던전, 레이드, 시즌 콘텐츠용 구성",
      style: "recommended",
      visible: true,
      items: [
        {
          id: "gem-5",
          name: "보석 5개",
          unit: "기본 구성",
          price: "5,000원",
          badge: "",
          style: "basic",
          visible: true
        },
        {
          id: "gem-20",
          name: "보석 20개",
          unit: "추천 구성",
          price: "15,000원",
          badge: "추천",
          style: "recommended",
          visible: true
        },
        {
          id: "entry-100",
          name: "상급 입장권 100개",
          unit: "고급 사전 입장권",
          price: "6,000원",
          badge: "이벤트",
          style: "event",
          visible: true
        }
      ]
    },
    {
      id: "service",
      title: "대행 서비스",
      subtitle: "진행 가능 여부를 먼저 확인합니다",
      style: "basic",
      visible: true,
      items: [
        {
          id: "main-quest",
          name: "메인 퀘스트",
          unit: "구간별 견적",
          price: "상담 문의",
          badge: "상담",
          style: "recommended",
          visible: true
        },
        {
          id: "hourly",
          name: "시간제 진행",
          unit: "1시간 기준",
          price: "10,000원",
          badge: "",
          style: "basic",
          visible: true
        },
        {
          id: "paused-sample",
          name: "시즌 한정 패키지",
          unit: "재정비 중",
          price: "중지",
          badge: "중지",
          style: "paused",
          visible: true
        }
      ]
    }
  ]
};
