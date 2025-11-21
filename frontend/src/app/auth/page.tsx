"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Phone, Lock, User, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Link from 'next/link';
import { useVerification } from '../hooks/useVerification';
import toast from 'react-hot-toast';
import PhoneInput from '@/components/PhoneInput';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'CLIENT' | 'MEDIC'>('CLIENT');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Шаги регистрации: phone -> code -> details
  const [step, setStep] = useState<'phone' | 'code' | 'details'>('phone');
  const [verificationCode, setVerificationCode] = useState('');
  const [timer, setTimer] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });

  const { register, login } = useAuth();
  const { sendCode, verifyCode } = useVerification();

  // Таймер для повторной отправки кода
  React.useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Отправка кода на телефон
  const handleSendCode = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      toast.error('Введите корректный номер телефона');
      return;
    }

    setLoading(true);
    try {
      await sendCode(formData.phone, 'sms');
      toast.success('📱 Код отправлен на ваш телефон!');
      setStep('code');
      setTimer(60);
    } catch (err: any) {
      toast.error(err.message || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  // Проверка кода
  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Введите 6-значный код');
      return;
    }

    setLoading(true);
    try {
      await verifyCode(formData.phone, verificationCode);
      toast.success('✅ Телефон подтверждён!');
      setStep('details');
    } catch (err: any) {
      toast.error(err.message || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  // Завершение регистрации
  const handleCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.password) {
      toast.error('Заполните все поля');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Пароль должен быть минимум 6 символов');
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        phone: formData.phone,
        password: formData.password,
        name: formData.name,
        role: role,
      });

      // ✅ Сохраняем в localStorage
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // ✅ ДОБАВЛЕНО: Сохраняем в cookies для middleware
      document.cookie = `token=${result.token}; path=/; max-age=${30 * 24 * 60 * 60}`; // 30 дней

      toast.success('✅ Регистрация успешна!');

      setTimeout(() => {
        if (result.user.role === 'CLIENT') {
          router.push('/client/orders');
        } else if (result.user.role === 'MEDIC') {
          router.push('/medic/dashboard');
        } else if (result.user.role === 'ADMIN') {
          router.push('/admin');
        }
      }, 500);

    } catch (err: any) {
      toast.error(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };


  // Вход
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.phone, formData.password);

      // ✅ Сохраняем в localStorage
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // ✅ ДОБАВЛЕНО: Сохраняем в cookies для middleware
      document.cookie = `token=${result.token}; path=/; max-age=${30 * 24 * 60 * 60}`; // 30 дней

      toast.success('✅ Вход выполнен!');

      setTimeout(() => {
        if (result.user.role === 'CLIENT') {
          router.push('/client/orders');
        } else if (result.user.role === 'MEDIC') {
          router.push('/medic/dashboard');
        } else if (result.user.role === 'ADMIN') {
          router.push('/admin');
        }
      }, 500);

    } catch (err: any) {
      toast.error(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 mb-4 shadow-lg shadow-blue-500/50">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">MedicPro</h1>
          <p className="text-slate-400">Медицинская помощь на дому</p>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 shadow-2xl">
          
          {/* Вход / Регистрация Toggle */}
          <div className="flex rounded-2xl bg-white/5 p-1 mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setStep('phone');
              }}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                isLogin
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setStep('phone');
              }}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                !isLogin
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* ВХОД */}
          {isLogin && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Телефон
                </label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                  placeholder="+7 (___) ___-__-__"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>
              <div className="text-center mt-4">
                <Link href="/auth/forgot-password" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm">
                  Забыли пароль?
                </Link>
              </div>
            </form>
          )}

          {/* РЕГИСТРАЦИЯ */}
          {!isLogin && (
            <>
              {/* Шаг 1: Выбор роли и ввод телефона */}
              {step === 'phone' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Зарегистрироваться как:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('CLIENT')}
                        className={`py-4 rounded-xl font-semibold transition-all border-2 ${
                          role === 'CLIENT'
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        👤 Пациент
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('MEDIC')}
                        className={`py-4 rounded-xl font-semibold transition-all border-2 ${
                          role === 'MEDIC'
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        💊 Медик
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Телефон
                    </label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(value) => setFormData({ ...formData, phone: value })}
                      placeholder="+7 (___) ___-__-__"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Отправка...' : 'Получить код'}
                  </button>
                </div>
              )}

              {/* Шаг 2: Ввод кода */}
              {step === 'code' && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="flex items-center text-slate-400 hover:text-white transition-colors mb-4"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Назад
                  </button>

                  <div className="text-center mb-6">
                    <div className="text-slate-300 mb-2">
                      Введите код, отправленный на
                    </div>
                    <div className="text-white font-semibold">{formData.phone}</div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(value);
                      }}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-center text-2xl font-bold tracking-widest placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Проверка...' : 'Подтвердить'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={timer > 0}
                    className="w-full py-3 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {timer > 0 ? `Отправить повторно через ${timer}с` : 'Отправить код повторно'}
                  </button>
                </div>
              )}

              {/* Шаг 3: Заполнение данных */}
              {step === 'details' && (
                <form onSubmit={handleCompleteRegister} className="space-y-4">
                  <div className="flex items-center text-green-400 mb-4">
                    <Check className="w-5 h-5 mr-2" />
                    <span className="text-sm">Телефон подтверждён</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Имя
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ваше имя"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Пароль
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Минимум 6 символов"
                        className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Регистрация...' : 'Завершить регистрацию'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-400">
          <p>Регистрируясь, вы соглашаетесь с</p>
          <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Условиями использования
          </button>
        </div>
      </div>
    </div>
  );
}