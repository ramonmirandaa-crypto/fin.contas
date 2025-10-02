import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type NetworkStatusType = 'online' | 'offline' | 'unknown';
type NetworkStatusReason = 'initial' | 'navigator' | 'manual';

export interface NetworkStatusValue {
  isOnline: boolean;
  status: NetworkStatusType;
  reason: NetworkStatusReason;
  lastChangedAt: number | null;
  refresh: () => void;
}

interface NetworkState {
  isOnline: boolean;
  status: NetworkStatusType;
  reason: NetworkStatusReason;
  lastChangedAt: number | null;
}

const NetworkStatusContext = createContext<NetworkStatusValue | undefined>(undefined);

function readNavigatorStatus(): boolean | null {
  if (typeof navigator === 'undefined' || typeof navigator.onLine === 'undefined') {
    return null;
  }

  return navigator.onLine;
}

function buildInitialState(): NetworkState {
  const navigatorStatus = readNavigatorStatus();
  const isOnline = navigatorStatus !== false;
  const status: NetworkStatusType = navigatorStatus === null ? 'unknown' : navigatorStatus ? 'online' : 'offline';

  return {
    isOnline,
    status,
    reason: 'initial',
    lastChangedAt: navigatorStatus === null ? null : Date.now(),
  };
}

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NetworkState>(() => buildInitialState());

  const applyStatus = useCallback((online: boolean, reason: NetworkStatusReason) => {
    setState({
      isOnline: online,
      status: online ? 'online' : 'offline',
      reason,
      lastChangedAt: Date.now(),
    });
  }, []);

  const markUnknown = useCallback((reason: NetworkStatusReason) => {
    setState(previous => ({
      ...previous,
      status: 'unknown',
      reason,
      lastChangedAt: Date.now(),
    }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleOnline = () => applyStatus(true, 'navigator');
    const handleOffline = () => applyStatus(false, 'navigator');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [applyStatus]);

  const refresh = useCallback(() => {
    const currentStatus = readNavigatorStatus();

    if (currentStatus === null) {
      markUnknown('manual');
      return;
    }

    applyStatus(currentStatus, 'manual');
  }, [applyStatus, markUnknown]);

  const value = useMemo<NetworkStatusValue>(
    () => ({
      ...state,
      refresh,
    }),
    [state, refresh]
  );

  return <NetworkStatusContext.Provider value={value}>{children}</NetworkStatusContext.Provider>;
}

export function useNetworkStatusContext(): NetworkStatusValue {
  const context = useContext(NetworkStatusContext);

  if (!context) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }

  return context;
}
