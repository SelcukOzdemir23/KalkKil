import {useState, useEffect, useRef} from 'react';
import {formatCountdown} from '../utils/format';

interface UseCountdownResult {
  countdown: string;
  remainingMs: number;
  isExpired: boolean;
}

export function useCountdown(targetDate: Date | null): UseCountdownResult {
  const [countdown, setCountdown] = useState('00:00:00');
  const [remainingMs, setRemainingMs] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!targetDate) {
      setCountdown('00:00:00');
      setRemainingMs(0);
      setIsExpired(true);
      return;
    }

    const update = () => {
      const now = Date.now();
      const diff = targetDate.getTime() - now;

      if (diff <= 0) {
        setCountdown('00:00:00');
        setRemainingMs(0);
        setIsExpired(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      setCountdown(formatCountdown(diff));
      setRemainingMs(diff);
      setIsExpired(false);
    };

    update();
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [targetDate]);

  return {countdown, remainingMs, isExpired};
}
