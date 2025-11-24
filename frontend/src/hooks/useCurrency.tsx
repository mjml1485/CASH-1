import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import * as settingsService from '../services/settingsService';

// Cache currency to avoid re-fetching on every render
const currencyCache = new Map<string, { currency: string; timestamp: number }>();
const CACHE_DURATION = 60000; // 60 seconds

export function useCurrency() {
  const { currentUser } = useAuth();
  const [currency, setCurrency] = useState('PHP');
  const [loading, setLoading] = useState(false); // Start as false to prevent blocking
  const hasLoadedRef = useRef(false);

  const loadCurrency = useCallback(async () => {
    if (!currentUser) {
      setCurrency('PHP');
      hasLoadedRef.current = false;
      return;
    }

    // Check cache first
    const cached = currencyCache.get(currentUser.uid);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setCurrency(cached.currency);
      hasLoadedRef.current = true;
      return;
    }

    // Only show loading if we haven't loaded yet
    if (!hasLoadedRef.current) {
      setLoading(true);
    }

    try {
      const settings = await settingsService.getSettings();
      const currencyValue = settings.currency || 'PHP';
      setCurrency(currencyValue);
      // Cache the result
      currencyCache.set(currentUser.uid, { currency: currencyValue, timestamp: now });
      hasLoadedRef.current = true;
    } catch (err) {
      console.error('Failed to load currency:', err);
      setCurrency('PHP');
      currencyCache.set(currentUser.uid, { currency: 'PHP', timestamp: now });
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const updateCurrency = useCallback(async (newCurrency: string) => {
    if (!currentUser) return;
    
    try {
      await settingsService.updateSettings({ currency: newCurrency });
      setCurrency(newCurrency);
      // Update cache
      currencyCache.set(currentUser.uid, { currency: newCurrency, timestamp: Date.now() });
    } catch (err) {
      console.error('Failed to update currency:', err);
      throw err;
    }
  }, [currentUser]);

  useEffect(() => {
    loadCurrency();
  }, [loadCurrency]);

  return { currency, loading, updateCurrency, refreshCurrency: loadCurrency };
}

