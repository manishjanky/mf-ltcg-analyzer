import { writable } from 'svelte/store';
import type { Transaction } from '../services/parser';

function persisted<T>(key: string, initial: T) {
  const stored = typeof window !== 'undefined' ? sessionStorage.getItem(key) : null;
  const data = stored ? JSON.parse(stored) as T : initial;
  const w = writable<T>(data);
  if (typeof window !== 'undefined') {
    w.subscribe((v) => sessionStorage.setItem(key, JSON.stringify(v)));
  }
  return w;
}

export const transactions = persisted<Transaction[]>('transactions', []);
export const schemesLtcg = persisted<Record<string, number>>('schemesLtcg', {});
export const theme = persisted<'light'|'dark'>('theme', (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light');
