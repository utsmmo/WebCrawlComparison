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

import { getApiUrl } from "@/app/pages/admin/SettingsPage";

// ============================================================================
// API Configuration
// ============================================================================

const getApiBase = () => getApiUrl() || '/api';

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
        // Find the room with lowest OTA price
        let lowestPriceRoom: RoomData | null = null;
        let lowestPrice = Infinity;

        for (const room of hotel.rooms) {
            const price = parsePrice(room.priceOTA);
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
    switch (source) {
        case 'myhotel':
            if (!params) throw new Error('Checkin/checkout params required for myhotel');
            return getMyHotelsReport(params);

        case 'myhotel-today':
            return getMyHotelsToday();

        default:
            // It's a region slug
            if (!params) throw new Error('Checkin/checkout params required for region');
            return getRegionReport(source as RegionSlug, params);
    }
}
