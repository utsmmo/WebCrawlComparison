export const APP_CONFIG = {
    NAME: "JoyOn Rate",
    VERSION: "1.0.0",
    CURRENCY: "VND",
    LOCALE: "vi-VN",
    DEFAULT_TARGET_PRICE: 4000000,
    CRAWL_DELAY_MS: 2000,
};

export const ORDER_STATUS = {
    OK: "ok",
    FAIL: "fail",
    DELAY: "delay",
} as const;

export const PRICE_TREND = {
    UP: "up",
    DOWN: "down",
    STABLE: "stable",
} as const;

export const API_CONFIG = {
    BASE_URL: "/api",
    TIMEOUT: 30000,
    REGIONS: [
        { slug: "myhotel", name: "Khách sạn của tôi" },
        { slug: "hoi-an", name: "Hội An" },
        { slug: "da-nang", name: "Đà Nẵng" },
        { slug: "da-lat", name: "Đà Lạt" },
        { slug: "nha-trang", name: "Nha Trang" },
        { slug: "phu-quoc", name: "Phú Quốc" },
    ],
} as const;

