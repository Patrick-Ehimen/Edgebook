import { useMutation } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { authApi } from '../api';

const COOLDOWN = 60;

export function useResendVerification(email: string) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setSecondsLeft(COOLDOWN);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const mutation = useMutation({
    mutationFn: () => authApi.resendVerification({ email }),
    onSuccess: startCooldown,
  });

  return { ...mutation, secondsLeft, canResend: secondsLeft === 0 };
}
