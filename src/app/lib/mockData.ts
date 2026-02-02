// Mock data for demo purposes

export interface User {
  id: string;
  email: string;
  role: "admin" | "member";
  name: string;
}

export interface Group {
  id: string;
  name: string;
  location: string;
}

export interface Competitor {
  id: string;
  name: string;
  groupId: string;
  priority: "high" | "medium" | "low";
  tags: string[];
  source: string;
}

export interface PriceSnapshot {
  competitorId: string;
  competitorName: string;
  minPrice: number;
  avgPrice: number;
  sourcePrice: number;
  difference: number;
  differencePercent: number;
  trend: "up" | "down" | "stable";
  status: "ok" | "fail" | "delay";
  crawledAt: string;
  link: string;
  isMyHotel?: boolean; // Flag to identify our hotel
}

export const mockUsers: User[] = [
  { id: "1", email: "admin@joyon.com", role: "admin", name: "Admin User" },
  { id: "2", email: "member@joyon.com", role: "member", name: "Member User" },
];

export const mockGroups: Group[] = [
  { id: "1", name: "Hội An", location: "Hội An, Quảng Nam" },
  { id: "2", name: "Đà Nẵng", location: "Đà Nẵng" },
  { id: "3", name: "Đà Lạt", location: "Đà Lạt, Lâm Đồng" },
  { id: "4", name: "Nha Trang", location: "Nha Trang, Khánh Hòa" },
  { id: "5", name: "Phú Quốc", location: "Phú Quốc, Kiên Giang" },
];

export const mockCompetitors: Competitor[] = [
  {
    id: "1",
    name: "Anantara Hoi An Resort",
    groupId: "1",
    priority: "high",
    tags: ["Luxury", "Top Priority"],
    source: "Booking.com",
  },
  {
    id: "2",
    name: "Four Seasons The Nam Hai",
    groupId: "1",
    priority: "high",
    tags: ["Luxury", "Same Segment"],
    source: "Agoda",
  },
  {
    id: "3",
    name: "Little Riverside Hoi An",
    groupId: "1",
    priority: "medium",
    tags: ["Boutique"],
    source: "Booking.com",
  },
  {
    id: "4",
    name: "InterContinental Danang",
    groupId: "2",
    priority: "high",
    tags: ["Luxury", "Top Priority"],
    source: "Booking.com",
  },
  {
    id: "5",
    name: "Hyatt Regency Danang",
    groupId: "2",
    priority: "high",
    tags: ["Luxury"],
    source: "Agoda",
  },
  {
    id: "6",
    name: "Ana Mandara Villas Dalat",
    groupId: "3",
    priority: "high",
    tags: ["Luxury", "Top Priority"],
    source: "Booking.com",
  },
];

export const mockPriceSnapshots: PriceSnapshot[] = [
  {
    competitorId: "1",
    competitorName: "Anantara Hoi An Resort",
    minPrice: 4500000,
    avgPrice: 5200000,
    sourcePrice: 4800000,
    difference: -300000,
    differencePercent: -5.88,
    trend: "down",
    status: "ok",
    crawledAt: "2026-02-02 08:30",
    link: "https://booking.com/hotel/anantara-hoian",
  },
  {
    competitorId: "2",
    competitorName: "Four Seasons The Nam Hai",
    minPrice: 12000000,
    avgPrice: 14500000,
    sourcePrice: 13200000,
    difference: 3200000,
    differencePercent: 32.0,
    trend: "stable",
    status: "ok",
    crawledAt: "2026-02-02 08:28",
    link: "https://agoda.com/four-seasons-nam-hai",
  },
  {
    competitorId: "3",
    competitorName: "Little Riverside Hoi An",
    minPrice: 2100000,
    avgPrice: 2600000,
    sourcePrice: 2300000,
    difference: -1700000,
    differencePercent: -42.5,
    trend: "up",
    status: "ok",
    crawledAt: "2026-02-02 08:25",
    link: "https://booking.com/hotel/little-riverside",
  },
  {
    competitorId: "4",
    competitorName: "InterContinental Danang",
    minPrice: 5800000,
    avgPrice: 6500000,
    sourcePrice: 6100000,
    difference: 1100000,
    differencePercent: 22.0,
    trend: "stable",
    status: "ok",
    crawledAt: "2026-02-02 08:20",
    link: "https://booking.com/hotel/intercontinental-danang",
  },
  {
    competitorId: "5",
    competitorName: "Hyatt Regency Danang",
    minPrice: 4200000,
    avgPrice: 4900000,
    sourcePrice: 4500000,
    difference: -500000,
    differencePercent: -10.0,
    trend: "down",
    status: "ok",
    crawledAt: "2026-02-02 08:32",
    link: "https://agoda.com/hyatt-regency-danang",
  },
];

// Local storage for auth
export const AUTH_KEY = "joyon_auth";

export function getCurrentUser(): User | null {
  const authData = localStorage.getItem(AUTH_KEY);
  if (!authData) return null;
  try {
    return JSON.parse(authData);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function logout() {
  setCurrentUser(null);
}