import { APP_CONFIG } from "@/app/constants/config";

/**
 * Formats a number as VND currency
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(APP_CONFIG.LOCALE, {
        style: "currency",
        currency: APP_CONFIG.CURRENCY
    }).format(amount);
};

/**
 * Formats a date string to a localized string
 */
export const formatDateTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString(APP_CONFIG.LOCALE, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
};
