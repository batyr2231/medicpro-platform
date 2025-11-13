"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

// Компонент с логикой автологина
function AutoLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Авторизация...');

  useEffect(() => {
    autoLogin();
  }, []);

  const autoLogin = async () => {
    try {
      const chatId = searchParams.get('chatId');
      const redirect = searchParams.get('redirect') || '/medic/dashboard';

      if (!chatId) {
        setStatus('error');
        setMessage('Ошибка: отсутствует chatId');
        return;
      }

      console.log('🔐 Auto-login with chatId:', chatId);

      // Пытаемся автологин
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/medics/auto-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chatId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка авторизации');
      }

      // Сохраняем токен и данные пользователя
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      console.log('✅ Auto-login successful:', data.user.name);

      setStatus('success');
      setMessage('Авторизация успешна! Перенаправление...');

      // Редиректим через 1 секунду
      setTimeout(() => {
        router.push(redirect);
      }, 1000);

    } catch (error: any) {
      console.error('❌ Auto-login error:', error);
      setStatus('error');
      setMessage(error.message || 'Ошибка авторизации');

      // Через 3 секунды редиректим на страницу входа
      setTimeout(() => {
        router.push('/auth');
      }, 3000);
    }
  };

  return (
    <div className="text-center">
      {status === 'loading' && (
        <>
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
            <Loader className="w-10 h-10 text-cyan-400 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Авторизация</h2>
          <p className="text-slate-300">{message}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Успешно!</h2>
          <p className="text-slate-300">{message}</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Ошибка</h2>
          <p className="text-slate-300 mb-4">{message}</p>
          <p className="text-sm text-slate-400">Перенаправление на страницу входа...</p>
        </>
      )}
    </div>
  );
}

// Основной компонент с Suspense
export default function MedicAutoLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 max-w-md w-full shadow-2xl">
        <Suspense fallback={
          <div className="text-center">
            <Loader className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-300">Загрузка...</p>
          </div>
        }>
          <AutoLoginContent />
        </Suspense>
      </div>
    </div>
  );
}