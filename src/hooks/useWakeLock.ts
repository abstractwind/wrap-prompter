import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppLanguage, SessionState, WakeLockStatus } from '../types/teleprompter';
import { MESSAGES } from '../utils/i18n';

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener?: (type: string, listener: () => void) => void;
}

export function useWakeLock(
  preventSleepEnabled: boolean,
  sessionState: SessionState,
  language: AppLanguage
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
    const t = MESSAGES[language];
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

    if (sentinelRef.current && !sentinelRef.current.released && !simulateFailure) {
      setStatus('active');
      setErrorReason(null);
      return;
    }

    if (simulateFailure) {
      await releaseLock();
      setStatus('failed');
      setErrorReason(t.wakeErrorSimulated);
      return;
    }

    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
    };

    if (!nav.wakeLock || typeof nav.wakeLock.request !== 'function') {
      setStatus('failed');
      setErrorReason(t.wakeErrorUnsupported);
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
      const msg = err instanceof Error ? err.message : 'Permission denied';
      setErrorReason(t.wakeErrorDenied(msg));
    }
  }, [preventSleepEnabled, sessionState, simulateFailure, releaseLock, language]);

  useEffect(() => {
    void acquireLock();
  }, [acquireLock]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && preventSleepEnabled && sessionState === 'active') {
        void acquireLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [acquireLock, preventSleepEnabled, sessionState]);

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
