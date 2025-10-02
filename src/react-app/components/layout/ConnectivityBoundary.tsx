import type { ReactNode } from 'react';
import { useNetworkStatus } from '@/react-app/hooks/useNetworkStatus';
import OfflineShell from '@/react-app/components/layout/OfflineShell';

interface ConnectivityBoundaryProps {
  children: ReactNode;
}

export default function ConnectivityBoundary({ children }: ConnectivityBoundaryProps) {
  const { isOnline, status } = useNetworkStatus();

  if (!isOnline && status !== 'unknown') {
    return <OfflineShell />;
  }

  return <>{children}</>;
}
