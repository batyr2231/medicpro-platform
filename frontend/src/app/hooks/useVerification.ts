"use client";

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async (phone: string, method: 'sms' | 'whatsapp' = 'sms') => {
    setLoading(true);
    setError(null);
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = '+' + cleanPhone;
    try {
      const response = await fetch(`${API_URL}/api/auth/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone, method }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send code');
      }

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (phone: string, code: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid code');
      }

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendCode, verifyCode, loading, error };
}