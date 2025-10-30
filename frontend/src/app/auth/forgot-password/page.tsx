'use client';

import React, { useState } from 'react';
import { ArrowLeft, Phone, Loader, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PhoneInput from '@/components/PhoneInput';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code' | 'password'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Отправка кода на телефон
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка отправки кода');
      }

      toast.success('✅ Код отправлен на телефон');
      setStep('code');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      toast.error('Введите 6-значный код');
      return;
    }

    setStep('password');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Пароль должен быть минимум 6 символов');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, code, newPassword })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сброса пароля');
      }

      toast.success('✅ Пароль успешно изменён!');
      setTimeout(() => router.push('/auth'), 1500);
    } catch (err: any) {
      toast.error(err.message || 'Ошибка сброса пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => router.push('/auth')}
          className="mb-6 flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Назад к входу</span>
        </button>

        {/* Card */}
        <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Key className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Восстановление пароля</h1>
            <p className="text-slate-400">
              {step === 'phone' && 'Введите номер телефона'}
              {step === 'code' && 'Введите код из СМС'}
              {step === 'password' && 'Создайте новый пароль'}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center ${step === 'phone' ? 'text-cyan-400' : 'text-green-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'phone' ? 'bg-cyan-500' : 'bg-green-500'
              }`}>
                {step === 'phone' ? '1' : '✓'}
              </div>
              <span className="ml-2 text-sm font-medium">Телефон</span>
            </div>
            <div className={`flex-1 h-1 mx-4 rounded ${
              step !== 'phone' ? 'bg-green-500' : 'bg-white/20'
            }`}></div>
            <div className={`flex items-center ${
              step === 'code' ? 'text-cyan-400' : step === 'password' ? 'text-green-400' : 'text-slate-500'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'code' ? 'bg-cyan-500' : step === 'password' ? 'bg-green-500' : 'bg-white/10'
              }`}>
                {step === 'password' ? '✓' : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">Код</span>
            </div>
            <div className={`flex-1 h-1 mx-4 rounded ${
              step === 'password' ? 'bg-green-500' : 'bg-white/20'
            }`}></div>
            <div className={`flex items-center ${
              step === 'password' ? 'text-cyan-400' : 'text-slate-500'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'password' ? 'bg-cyan-500' : 'bg-white/10'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Пароль</span>
            </div>
          </div>

          {/* Forms */}
          {step === 'phone' && (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Номер телефона
                </label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="+7 (___) ___-__-__"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 font-semibold shadow-lg transition-all flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5 mr-2" />
                    Отправить код
                  </>
                )}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Код из СМС
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Введите 6-значный код из СМС
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold shadow-lg transition-all"
              >
                Продолжить
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm"
              >
                Изменить номер
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Новый пароль
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  minLength={6}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Подтвердите пароль
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                  minLength={6}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 font-semibold shadow-lg transition-all flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5 mr-2" />
                    Сменить пароль
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}