/**
 * API Service Layer for datac.click integration
 * Provides type-safe functions for all hotel price crawling endpoints
 */

// ============================================================================
// Types - Matching actual API response structure
// ============================================================================

export interface RoomData {
    roomId: string;
    roomType: string;
    guests: string;
    originalPrice?: string;
    priceOTA?: string;
    priceReception?: string;
    priceCS?: string;
    breakfast?: string;
    roomsLeft?: string;
}

export interface HotelRawResponse {
    hotelId: string;
    hotelName: string;
    status: 'ok' | 'sold_out' | 'error';
    crawlDate?: string;
    rooms: RoomData[];
}

// Processed hotel data for UI
export interface HotelReport {
    hotelId: string;
    hotelName: string;
    status: 'ok' | 'sold_out' | 'error';
    crawlDate?: string;
    isMyHotel?: boolean; // Flag to identify user's own hotels
    // Lowest price room data
    priceOTA?: string;
    priceCS?: string;
    priceReception?: string;
    originalPrice?: string;
    roomType?: string;
    breakfast?: string;
    roomsLeft?: string;
    // All rooms for detailed view
    allRooms: RoomData[];
}

export interface CrawlParams {
    checkin: string;
    checkout: string;
    [key: string]: string;
}

import { API_CONFIG } from "@/app/constants/config";
import { format } from "date-fns";

// ============================================================================
// API Configuration
// ============================================================================

const getApiBase = () => API_CONFIG.BASE_URL;

export const REGIONS = {
    'da-nang': 'Đà Nẵng',
    'hoi-an': 'Hội An',
    'da-lat': 'Đà Lạt',
    'nha-trang': 'Nha Trang',
    'phu-quoc': 'Phú Quốc',
} as const;

export type RegionSlug = keyof typeof REGIONS;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse Vietnamese price format (e.g., "1.200.000") to number
 */
export function parsePrice(priceStr?: string | number): number {
    if (!priceStr) return 0;
    if (typeof priceStr === 'number') return priceStr;
    return parseInt(String(priceStr).replace(/\./g, '').replace(/,/g, ''), 10) || 0;
}

/**
 * Format number to Vietnamese currency
 */
export function formatVNDPrice(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = `${getApiBase()}${endpoint}`;
    if (!params) return url;
    const searchParams = new URLSearchParams(params);
    return `${url}?${searchParams.toString()}`;
}

/**
 * Transform raw API response to processed HotelReport
 * Extracts the lowest price room for main display
 */
function transformHotelData(rawData: HotelRawResponse[]): HotelReport[] {
    return rawData.map(hotel => {
        // Find the room with lowest Original Price
        let lowestPriceRoom: RoomData | null = null;
        let lowestPrice = Infinity;

        for (const room of hotel.rooms) {
            // Filter for 2 or 4 guests
            if (room.guests !== '2' && room.guests !== '4') continue;

            // User requested to compare based on "Original Price" only, ignoring OTA/CS
            const price = parsePrice(room.originalPrice);
            if (price > 0 && price < lowestPrice) {
                lowestPrice = price;
                lowestPriceRoom = room;
            }
        }

        return {
            hotelId: hotel.hotelId,
            hotelName: hotel.hotelName,
            status: hotel.status,
            crawlDate: hotel.crawlDate,
            // Use lowest price room data for main display
            priceOTA: lowestPriceRoom?.priceOTA,
            priceCS: lowestPriceRoom?.priceCS,
            priceReception: lowestPriceRoom?.priceReception,
            originalPrice: lowestPriceRoom?.originalPrice,
            roomType: lowestPriceRoom?.roomType,
            breakfast: lowestPriceRoom?.breakfast,
            roomsLeft: lowestPriceRoom?.roomsLeft,
            // Keep all rooms for detailed view
            allRooms: hotel.rooms,
        };
    });
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get price report for all configured "My Hotels"
 * GET /api/myhotel?checkin&checkout
 */
export async function getMyHotelsReport(params: CrawlParams): Promise<HotelReport[]> {
    const url = buildUrl('/api/myhotel', params);

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const rawData: HotelRawResponse[] = await response.json();
    return transformHotelData(rawData);
}

/**
 * Get quick report for My Hotels checking in today
 * GET /api/myhotel/today
 */
export async function getMyHotelsToday(): Promise<HotelReport[]> {
    const url = buildUrl('/api/myhotel/today');

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const rawData: HotelRawResponse[] = await response.json();
    return transformHotelData(rawData);
}

/**
 * Get price report for a specific region
 * GET /api/{region}?checkin&checkout
 */
export async function getRegionReport(
    region: RegionSlug,
    params: CrawlParams
): Promise<HotelReport[]> {
    const url = buildUrl(`/api/${region}`, params);

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const rawData: HotelRawResponse[] = await response.json();
    return transformHotelData(rawData);
}

// ============================================================================
// Mock Data Generator (Client-side)
// ============================================================================

// Hardcoded fallback data for demo (if localStorage missing)
const FALLBACK_HOIAN_56 = [
    { id: "101", hotelId: "golf-hoi-an", name: "ÊMM Hotel Hoi An", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "102", hotelId: "dubai-villa-hoi-an", name: "Ancient Haven", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "103", hotelId: "royal-riverside-hoian", name: "Royal Riverside Hoi An", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "104", hotelId: "central-boutique-villa", name: "Central Boutique Villa", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "105", hotelId: "little-hoi-an-boutique-resort-spa", name: "Little Hoi An", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "106", hotelId: "aman-boutique", name: "DE VIVRE HOI AN", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "107", hotelId: "thuy-duong-3-boutique-amp-spa", name: "ANNAM HERITAGE", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "108", hotelId: "hoi-an-silk-boutique-and-spa", name: "Silkotel Hoi An", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "109", hotelId: "yzistel-hoi-an", name: "Yzistel Hoi An", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "110", hotelId: "hoianan", name: "Hoianan Boutique Hotel", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "111", hotelId: "thanh-binh-riverside", name: "Thanh Binh Riverside", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "112", hotelId: "river-suites-hoi-an", name: "River Suites Hoi An", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "113", hotelId: "silk-eco-hotel-hoi-an", name: "Mulberry Collection Silk", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "114", hotelId: "lion-king-thanh-pho-hoi-an", name: "Lion King Hotel", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "115", hotelId: "la-charm-hoi-an-amp-spa", name: "La Charm Hoi An", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "116", hotelId: "thien-thanh", name: "Old Town Hotel", groupId: "hoi-an-5-6", isMyHotel: false },
    { id: "117", hotelId: "thien-trung-hoi-an", name: "Sala Hoi An Hotel", groupId: "hoi-an-5-6", isMyHotel: false },
];

function generateMockDataForRegion(region: string): HotelReport[] {
    try {
        console.log(`[Mock] Generating data for region: ${region}`);
        const storedCompetitors = localStorage.getItem("joyon_competitors");

        let competitors: any[] = [];
        if (storedCompetitors) {
            try {
                competitors = JSON.parse(storedCompetitors);
            } catch (e) { console.error("Error parsing stored competitors", e); }
        } else {
            console.warn("[Mock] No competitors found in localStorage");
        }

        let regionCompetitors = competitors.filter(c => c.groupId === region);

        // FALLBACK: Use hardcoded list if localStorage missed "Hội An 5,6"
        // This ensures the demo always works for this specific request
        if (regionCompetitors.length === 0 && (region === 'hoi-an-5-6' || region === 'hoi-an')) {
            console.warn(`[Mock] Using HARDCODED fallback for ${region}`);
            // If requesting generic Hoi An but empty, also fallback but filter maybe? 
            // For now just allow the 5-6 batch to show up if 5-6 is requested.
            if (region === 'hoi-an-5-6') regionCompetitors = FALLBACK_HOIAN_56;
        }

        console.log(`[Mock] Found ${regionCompetitors.length} competitors for region ${region}`);

        if (regionCompetitors.length === 0) {
            return [];
        }

        return regionCompetitors.map(comp => {
            // Generate random base price between 1.5M and 4M
            const basePrice = Math.floor(Math.random() * (4000000 - 1500000) + 1500000);
            const priceOTA = basePrice;
            const priceReception = basePrice * 1.1; // 10% higher
            const priceCS = basePrice * 0.9; // 10% lower

            const roomsLeft = Math.floor(Math.random() * 5) + 1; // 1-5 rooms
            const isSoldOut = Math.random() > 0.8; // 20% chance sold out

            // Random room type
            const roomTypes = ["Deluxe Double", "Suite City View", "Superior King", "Villa Garden"];
            const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];

            // Random breakfast
            const breakfastOptions = ["Included", "Free", "NO", "150.000 VND"];
            const breakfast = breakfastOptions[Math.floor(Math.random() * breakfastOptions.length)];

            return {
                hotelId: comp.hotelId,
                hotelName: comp.name,
                status: isSoldOut ? 'sold_out' : 'ok',
                crawlDate: new Date().toISOString(),
                isMyHotel: comp.isMyHotel,
                priceOTA: isSoldOut ? undefined : priceOTA.toString(),
                priceCS: isSoldOut ? undefined : priceCS.toString(),
                priceReception: isSoldOut ? undefined : priceReception.toString(),
                originalPrice: isSoldOut ? undefined : priceOTA.toString(),
                roomType: isSoldOut ? undefined : roomType,
                breakfast: isSoldOut ? undefined : breakfast,
                roomsLeft: isSoldOut ? "0" : roomsLeft.toString(),
                allRooms: []
            };
        });
    } catch (e) {
        console.error("Mock generation failed", e);
        return [];
    }
}

// ============================================================================
// Unified Crawl Function
// ============================================================================

export type CrawlSource = 'myhotel' | 'myhotel-today' | RegionSlug;

/**
 * Unified function to crawl prices based on source type
 */
export async function crawlPrices(
    source: CrawlSource,
    params?: CrawlParams
): Promise<HotelReport[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Disable mock data to force real API usage
    // const mockData = generateMockDataForRegion(source);
    // if (mockData.length > 0) { ... }

    try {
        console.log(`[Crawl] Fetching data for ${source}`);

        // CASE 1: My Hotel Reports (Legacy/Specific Endpoints)
        if (source === 'myhotel') {
            return await getMyHotelsReport(params || { checkin: format(new Date(), 'yyyy-MM-dd'), checkout: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd') });
        } else if (source === 'myhotel-today') {
            return await getMyHotelsToday();
        }

        // CASE 2: Region/Group Report (New Competitor API)
        else {
            const checkin = params?.checkin || format(new Date(), 'yyyy-MM-dd');
            const checkout = params?.checkout || format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

            // Call the new simplified API
            const competitorData = await getCompetitorPrices(source, checkin, checkout);

            // Map simplified response to HotelReport structure to maintain UI compatibility
            return competitorData.map(item => {
                const price = parsePrice(item.originalLowPrice);
                const isSoldOut = item.status.toLowerCase() === 'sold_out' || item.status.toLowerCase() === 'sold out';

                return {
                    hotelId: item.hotelId,
                    hotelName: item.hotelName,
                    status: isSoldOut ? 'sold_out' : 'ok',
                    crawlDate: new Date().toISOString(),
                    // Map originalLowPrice to originalPrice
                    originalPrice: isSoldOut ? undefined : (price > 0 ? price.toString() : undefined),
                    // Leave other price fields undefined as we focus on originalPrice
                    priceOTA: undefined,
                    priceCS: undefined,
                    priceReception: undefined,
                    // Map additional fields from new response
                    roomType: item.roomType,
                    breakfast: item.breakfast,
                    roomsLeft: item.roomsLeft,
                    allRooms: []
                };
            });
        }
    } catch (e) {
        console.error("Fetch failed", e);
    }

    console.warn(`API failed for ${source}, returning empty`);
    return [];
}

// ============================================================================
// Competitor Config & Price API (New)
// ============================================================================

export interface ConfigHotelItem {
    Id: string;
    Name: string;
}

export interface CompetitorConfigPayload {
    Id: string;
    Group: string;
    MyHotels: ConfigHotelItem[];
    Competitors: ConfigHotelItem[];
}

/**
 * Save competitor configuration to connection
 * POST /api/config/competitors
 */
export async function saveCompetitorConfig(config: CompetitorConfigPayload[]): Promise<void> {
    const url = `${getApiBase()}/api/config/competitors`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    });

    if (!response.ok) {
        throw new Error(`Config Save Error: ${response.status} ${response.statusText}`);
    }
}

export interface CompetitorPriceResponse {
    hotelId: string;
    hotelName: string;
    status: string; // "ok" | "sold_out"
    roomType?: string;
    guests?: string;
    originalLowPrice?: string; // "1.496.111" or undefined
    breakfast?: string;
    roomsLeft?: string;
}

/**
 * Get simplified competitor price report
 * GET /api/competitor-price?id=...&checkin=...&checkout=...&adults=all
 */
export async function getCompetitorPrices(
    groupId: string,
    checkin: string,
    checkout: string
): Promise<CompetitorPriceResponse[]> {
    const params = new URLSearchParams({
        id: groupId,
        checkin,
        checkout,
        adults: 'all'
    });

    const url = `${getApiBase()}/api/competitor-price?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Price Fetch Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

