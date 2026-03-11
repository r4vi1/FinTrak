import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
    if (amount === undefined || amount === null) return "₹0";
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        return format(date, 'MMM d, yyyy');
    } catch (e) {
        return dateString;
    }
}
