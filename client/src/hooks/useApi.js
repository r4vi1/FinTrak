import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Generic hook for fetching data from the API
 * @param {string} endpoint - API endpoint (e.g., '/accounts/summary/net-worth')
 * @returns {{ data: any, isLoading: boolean, error: string | null, refetch: function }}
 */
export function useApi(endpoint) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            const json = await response.json();
            setData(json);
        } catch (err) {
            setError(err.message);
            console.error(`Error fetching ${endpoint}:`, err);
        } finally {
            setIsLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}

// Pre-defined hooks for specific dashboard widgets
export function useNetWorth() {
    return useApi('/accounts/summary/net-worth');
}

export function useCashflow(months = 6) {
    return useApi(`/analytics/cashflow?months=${months}`);
}

export function useTopMerchants(limit = 5) {
    return useApi(`/analytics/top-merchants?limit=${limit}`);
}

export function useCategorySpend(dateFrom, dateTo) {
    let url = '/analytics/spending-by-category';
    if (dateFrom && dateTo) {
        url += `?date_from=${dateFrom}&date_to=${dateTo}`;
    } else {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        url += `?date_from=${month}-01`;
    }
    return useApi(url);
}

export function useDailySpending(month) {
    return useApi(`/analytics/daily-spending?month=${month}`);
}

export function useRecurring() {
    return useApi('/analytics/recurring');
}

export function useRecentTransactions(limit = 5) {
    return useApi(`/transactions?limit=${limit}`);
}

export function useTransactions(params = {}) {
    // Clean up undefined/null values
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value);
        }
    });

    const queryString = queryParams.toString();
    return useApi(`/transactions${queryString ? `?${queryString}` : ''}`);
}

export function useActiveRuleStats() {
    return useApi('/categories');
}

export function useCategories() {
    return useApi('/categories');
}

export function useAccounts() {
    return useApi('/accounts');
}
