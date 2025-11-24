import { getIdToken } from '../services/authService';

/**
 * Get authorization headers for API requests
 * @returns Authorization headers with Bearer token
 * @throws Error if no ID token is available
 */
export const getAuthHeaders = async () => {
    const token = await getIdToken();
    if (!token) throw new Error('No ID token available');
    return { Authorization: `Bearer ${token}` };
};

/**
 * Handle API errors consistently across services
 * @param context - Description of the operation that failed
 * @param err - The error object
 */
export const handleApiError = (context: string, err: any): never => {
    console.error(`${context} failed`, err);
    throw err;
};

/**
 * Map backend response to include consistent ID field
 * @param item - Item from backend with _id or id
 * @returns Item with id field
 */
export const mapIdField = <T extends { _id?: string; id?: string }>(item: T): T & { id: string } => {
    return {
        ...item,
        id: item._id || item.id || ''
    };
};

/**
 * Format date string to ISO format
 * @param date - Date string or Date object
 * @returns ISO formatted date string or original value if invalid
 */
export const formatDateToISO = (date: string | Date | undefined): string | undefined => {
    if (!date) return undefined;
    try {
        return new Date(date).toISOString();
    } catch {
        return undefined;
    }
};
