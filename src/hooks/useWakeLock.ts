import { useCallback, useEffect, useRef, useState } from 'react';
import type { SessionState, WakeLockStatus } from '../types/teleprompter';

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener?: (type: string, listener: () => void) => void;
}

export function useWakeLock(
  preventSleepEnabled: boolean,
  sessionState: SessionState
) {
  const [status, setStatus] = useState<WakeLockStatus>('off');
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  const releaseLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        if (!sentinelRef.current.released) {
          await sentinelRef.current.release();
        }
      } catch {
        // Ignore release errors on already released sentinel
      } finally {
        sentinelRef.current = null;
      }
    }
  }, []);

  const acquireLock = useCallback(async () => {
    if (!preventSleepEnabled) {
      await releaseLock();
      setStatus('off');
      setErrorReason(null);
      return;
    }

    if (sessionState !== 'active') {
      await releaseLock();
      setStatus('pending');
      setErrorReason(null);
      return;
    }

    // Already holding an active unreleased sentinel — do not duplicate assertions
    if (sentinelRef.current && !sentinelRef.current.released && !simulateFailure) {
      setStatus('active');
      setErrorReason(null);
      return;
    }

    if (simulateFailure) {
      await releaseLock();
      setStatus('failed');
      setErrorReason('模拟系统电源策略限制，请点击重试');
      return;
    }

    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
    };

    if (!nav.wakeLock || typeof nav.wakeLock.request !== 'function') {
      setStatus('failed');
      setErrorReason('当前浏览器环境不支持 Screen Wake Lock API');
      return;
    }

    try {
      const sentinel = await nav.wakeLock.request('screen');
      sentinelRef.current = sentinel;
      setStatus('active');
      setErrorReason(null);

      sentinel.addEventListener?.('release', () => {
        if (sentinelRef.current === sentinel) {
          sentinelRef.current = null;
        }
      });
    } catch (err) {
      sentinelRef.current = null;
      setStatus('failed');
      const msg = err instanceof Error ? err.message : '浏览器拒绝屏幕常亮请求';
      setErrorReason(`请求被拒绝（${msg}）`);
    }
  }, [preventSleepEnabled, sessionState, simulateFailure, releaseLock]);

  useEffect(() => {
    void acquireLock();
  }, [acquireLock]);

  // Re-verify wake lock when returning from background / screen wake
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && preventSleepEnabled && sessionState === 'active') {
        void acquireLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [acquireLock, preventSleepEnabled, sessionState]);

  // Release on unmount
  useEffect(() => {
    return () => {
      void releaseLock();
    };
  }, [releaseLock]);

  const retry = useCallback(() => {
    setSimulateFailure(false);
    void acquireLock();
  }, [acquireLock]);

  return {
    wakeLockStatus: status,
    wakeLockError: errorReason,
    simulateFailure,
    setSimulateFailure,
    retryWakeLock: retry,
    verifyWakeLock: acquireLock,
  };
}
