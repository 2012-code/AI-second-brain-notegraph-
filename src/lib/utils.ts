import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
            const mins = Math.floor(diff / (1000 * 60));
            return mins <= 1 ? 'just now' : `${mins}m ago`;
        }
        return `${hours}h ago`;
    }
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function truncate(str: string, len: number): string {
    return str.length > len ? str.slice(0, len) + '...' : str;
}

export function debounce<T extends (...args: Parameters<T>) => void>(
    fn: T,
    delay: number
) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export function isTrialActive(trialEndsAt: string | null): boolean {
    if (!trialEndsAt) return false;
    return new Date(trialEndsAt) > new Date();
}

export function isSubscriptionActive(
    status: string,
    trialEndsAt: string | null,
    periodEnd: string | null
): boolean {
    if (status === 'active') {
        return !periodEnd || new Date(periodEnd) > new Date();
    }
    if (status === 'trialing') {
        return isTrialActive(trialEndsAt);
    }
    return false;
}

export function getWordCount(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}
