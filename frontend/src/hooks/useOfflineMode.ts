import { useState, useEffect, useCallback } from 'react';

interface OfflineData {
  [key: string]: {
    data: any;
    timestamp: number;
    expiresAt?: number;
  };
}

interface OfflineQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
  retries: number;
}

export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [cachedData, setCachedData] = useState<OfflineData>({});

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load cached data and queue from localStorage
    loadFromStorage();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadFromStorage = () => {
    try {
      const storedQueue = localStorage.getItem('offlineQueue');
      const storedCache = localStorage.getItem('offlineCache');

      if (storedQueue) {
        setOfflineQueue(JSON.parse(storedQueue));
      }

      if (storedCache) {
        setCachedData(JSON.parse(storedCache));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const saveToStorage = useCallback((queue: OfflineQueueItem[], cache: OfflineData) => {
    try {
      localStorage.setItem('offlineQueue', JSON.stringify(queue));
      localStorage.setItem('offlineCache', JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }, []);

  const cacheData = useCallback((key: string, data: any, ttl?: number) => {
    const newCache = {
      ...cachedData,
      [key]: {
        data,
        timestamp: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : undefined,
      },
    };
    setCachedData(newCache);
    saveToStorage(offlineQueue, newCache);
  }, [cachedData, offlineQueue, saveToStorage]);

  const getCachedData = useCallback((key: string) => {
    const cached = cachedData[key];
    if (!cached) return null;

    // Check if data has expired
    if (cached.expiresAt && Date.now() > cached.expiresAt) {
      const newCache = { ...cachedData };
      delete newCache[key];
      setCachedData(newCache);
      saveToStorage(offlineQueue, newCache);
      return null;
    }

    return cached.data;
  }, [cachedData, offlineQueue, saveToStorage]);

  const addToQueue = useCallback((
    action: 'create' | 'update' | 'delete',
    endpoint: string,
    data: any
  ) => {
    const queueItem: OfflineQueueItem = {
      id: `${Date.now()}-${Math.random()}`,
      action,
      endpoint,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    const newQueue = [...offlineQueue, queueItem];
    setOfflineQueue(newQueue);
    saveToStorage(newQueue, cachedData);

    return queueItem.id;
  }, [offlineQueue, cachedData, saveToStorage]);

  const processOfflineQueue = useCallback(async () => {
    if (!isOnline || offlineQueue.length === 0) return;

    const processedItems: string[] = [];
    const failedItems: OfflineQueueItem[] = [];

    for (const item of offlineQueue) {
      try {
        // Simulate API call processing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // In a real implementation, you would make the actual API call here
        console.log(`Processing offline action: ${item.action} ${item.endpoint}`, item.data);
        
        processedItems.push(item.id);
      } catch (error) {
        console.error('Error processing offline item:', error);
        
        if (item.retries < 3) {
          failedItems.push({
            ...item,
            retries: item.retries + 1,
          });
        }
      }
    }

    // Update queue with failed items only
    const newQueue = failedItems;
    setOfflineQueue(newQueue);
    saveToStorage(newQueue, cachedData);

    if (processedItems.length > 0) {
      console.log(`Processed ${processedItems.length} offline items`);
    }
  }, [isOnline, offlineQueue, cachedData, saveToStorage]);

  const clearCache = useCallback(() => {
    setCachedData({});
    localStorage.removeItem('offlineCache');
  }, []);

  const clearQueue = useCallback(() => {
    setOfflineQueue([]);
    localStorage.removeItem('offlineQueue');
  }, []);

  return {
    isOnline,
    offlineQueue,
    cachedData,
    cacheData,
    getCachedData,
    addToQueue,
    processOfflineQueue,
    clearCache,
    clearQueue,
    queueSize: offlineQueue.length,
  };
};