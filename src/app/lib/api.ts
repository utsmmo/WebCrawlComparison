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
    guests?: string;
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
            const guests = params?.guests || params?.adults;

            // Call the new simplified API
            const competitorData = await getCompetitorPrices(source, checkin, checkout, guests);

            // Map simplified response to HotelReport structure to maintain UI compatibility
            return competitorData.map(item => {
                const price = parsePrice(item.originalLowPrice);
                const status = item.status || 'ok';
                const isSoldOut = status.toLowerCase() === 'sold_out' || status.toLowerCase() === 'sold out';

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
                    guests: item.guests,
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
 * GET /api/competitor-price?id=...&checkin=...&checkout=...&guests=...
 */
export async function getCompetitorPrices(
    groupId: string,
    checkin: string,
    checkout: string,
    guests?: string
): Promise<CompetitorPriceResponse[]> {
    const queryParams: Record<string, string> = {
        id: groupId,
        checkin,
        checkout,
        guests: guests || '2' // Default to 2 if not specified, user said API works with guests=4
    };

    const params = new URLSearchParams(queryParams);

    const url = `${getApiBase()}/api/competitor-price?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Price Fetch Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
}

