"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Heart, MapPin, Clock, User, Phone, FileText, CheckCircle, Navigation, AlertCircle, Menu, Loader, Car, Play, DollarSign, MessageSquare } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import OrderSkeleton from '@/components/OrderSkeleton';
import { io } from 'socket.io-client';
import ProcedureList from '@/components/ProcedureList';


export default function MedicDashboard() {
  const [activeTab, setActiveTab] = useState('available');
  const { t } = useTranslation();
  const [medicInfo, setMedicInfo] = useState<any>(null);
  
  const { getAvailableOrders, getMyOrders, acceptOrder, updateOrderStatus, markPaymentReceived, loading: ordersLoading } = useOrders();
  const [realOrders, setRealOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [profileProgress, setProfileProgress] = useState({
    hasSpecialization: false,
    hasExperience: false,
    hasCity: false,
    hasAreas: false,
    hasDocuments: false,
    hasTelegram: false
  });
  const router = useRouter();

  useEffect(() => {
    loadMedicInfo();
    loadOrders();
    
    const interval = setInterval(() => {
      if (activeTab === 'available') {
        loadAvailableOrders();
      } else {
        loadMyOrders();
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [activeTab]);

  // ✅ ДОБАВЛЕНО: WebSocket для новых заказов
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return;

  // Подключаемся к Socket.IO
  const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('✅ Dashboard socket connected');
    socket.emit('authenticate', token);
  });

  // Слушаем новые заказы
  socket.on('new-order', (order: any) => {
    console.log('🔔 New order received:', order);
    
    // Добавляем заказ в список
    setRealOrders(prev => {
      const exists = prev.find(o => o.id === order.id);
      if (exists) return prev;
      return [order, ...prev];
    });
    
    // ✅ Воспроизводим звук
    (window as any).playNotificationSound?.();
    
    // Показываем toast уведомление
    toast.success('🔔 Новый заказ доступен!', {
      duration: 5000,
      icon: '💉',
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ Dashboard socket disconnected');
  });

  return () => {
    socket.disconnect();
  };
}, []); // Пустой массив - выполняется 1 раз при монтировании

  useEffect(() => {
    checkOnboardingProgress();
  }, []);

  const checkOnboardingProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/medics/profile`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const profile = await response.json();

      const progress = {
        hasSpecialization: !!profile.specialization,
        hasExperience: profile.experience > 0,
        hasCity: !!profile.city,
        hasAreas: profile.areas && profile.areas.length > 0,
        hasDocuments: profile.documents && profile.documents.length > 0,
        hasTelegram: !!profile.telegramChatId
      };

      setProfileProgress(progress);

      const allComplete = Object.values(progress).every(v => v === true);
      setOnboardingComplete(allComplete);

      // Сохраняем в localStorage чтобы не показывать повторно
      const dismissed = localStorage.getItem('onboarding-dismissed');
      if (allComplete || dismissed === 'true') {
        setOnboardingComplete(true);
      }

    } catch (error) {
      console.error('Check onboarding error:', error);
    }
  };

  const loadMedicInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/medics/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (response.ok) {
        setMedicInfo(result);
      }
    } catch (err) {
      // Ошибка загрузки профиля
    }
  };

  const loadOrders = () => {
    if (activeTab === 'available') {
      loadAvailableOrders();
    } else {
      loadMyOrders();
    }
  };

  const loadAvailableOrders = async () => {
    try {
      const orders = await getAvailableOrders();
      setRealOrders(orders);
    } catch (err) {
      // Ошибка загрузки доступных заказов
    }
  };

  const loadMyOrders = async () => {
    try {
      const orders = await getMyOrders();
      setMyOrders(orders);
    } catch (err) {
      // Ошибка загрузки моих заказов
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const result = await acceptOrder(orderId);
      toast.success('✅ Заказ принят!');
      
      setRealOrders(prev => prev.filter(o => o.id !== orderId));
      setMyOrders(prev => [...prev, result]);
      
      // Переключаем на вкладку "Мои заказы"
      setActiveTab('my');
      
      // Прокручиваем наверх
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err: any) {
      toast.error('Ошибка: ' + err.message);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      toast.success('✅ Статус обновлён!');
      
      setMyOrders(prev => 
        prev.map(order => 
          order.id === orderId ? result : order
        )
      );
      
    } catch (err: any) {
      toast.error('Ошибка обновления: ' + err.message);
    }
  };

  const handlePaymentReceived = async (orderId: string) => {
    try {
      await markPaymentReceived(orderId);
      toast.success('✅ Оплата получена!');
      loadMyOrders();
    } catch (err) {
      toast.error('❌ Ошибка при отметке оплаты');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACCEPTED: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
      CONFIRMED: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
      ON_THE_WAY: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
      STARTED: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      COMPLETED: 'bg-green-500/20 border-green-500/30 text-green-400',
      PAID: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    };
    return colors[status] || 'bg-slate-500/20 border-slate-500/30 text-slate-400';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      ACCEPTED: 'Ожидание подтверждения',
      CONFIRMED: 'Подтверждён',
      ON_THE_WAY: 'В пути',
      STARTED: 'На месте',
      COMPLETED: 'Завершён',
      PAID: 'Оплачено',
    };
    return texts[status] || status;
  };

  const handleLogout = () => {
    if (confirm('Вы уверены что хотите выйти?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Аватар медика */}
              {medicInfo?.avatar ? (
                <img
                  src={medicInfo.avatar}
                  alt={medicInfo.name}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-cyan-500/30 shadow-lg"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-500/50">
                  {medicInfo?.name?.[0] || '?'}
                </div>
              )}
              
              <div>
                <div className="font-bold text-lg">{medicInfo?.name || 'Медик'}</div>
                <div className="text-xs text-slate-400">{medicInfo?.specialization || 'Специалист'}</div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                className="flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all bg-green-500/20 border-green-500/30 text-green-400"
              >
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm font-medium hidden sm:inline">В сети</span>
              </button>

              <button 
                onClick={() => router.push('/medic/profile')}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              <LanguageSwitcher />

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <span className="text-sm hidden sm:inline">{t('common.logout')}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button> 
            </div>
          </div>
        </div>
      </header>

      {/* Начало основного контента. 
        Этот div (max-w-7xl) оборачивает и Онбординг, и Stats, и Tabs 
      */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Онбординг блок */}
        {!onboardingComplete && (
          <div className="mb-8 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-500/30 p-6 backdrop-blur-xl animate-pulse-slow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Добро пожаловать в MedicPro! 👋</h3>
                  <p className="text-slate-300 text-sm">Завершите настройку профиля чтобы начать получать заказы</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  localStorage.setItem('onboarding-dismissed', 'true');
                  setOnboardingComplete(true);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Прогресс бар */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-300">Прогресс настройки</span>
                <span className="text-cyan-400 font-bold">
                  {Object.values(profileProgress).filter((v) => v).length} / 6
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                  style={{ 
                    width: `${(Object.values(profileProgress).filter((v) => v).length / 6) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Чеклист */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/medic/profile')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  profileProgress.hasSpecialization
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-white/5 border-white/10 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    profileProgress.hasSpecialization ? 'bg-green-500' : 'bg-white/10'
                  }`}>
                    {profileProgress.hasSpecialization ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-slate-400">1</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${profileProgress.hasSpecialization ? 'text-green-400' : 'text-white'}`}>
                      Укажите специализацию
                    </div>
                    <div className="text-xs text-slate-400">Терапевт, Медсестра и т.д.</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/medic/profile')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  profileProgress.hasExperience
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-white/5 border-white/10 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    profileProgress.hasExperience ? 'bg-green-500' : 'bg-white/10'
                  }`}>
                    {profileProgress.hasExperience ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-slate-400">2</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${profileProgress.hasExperience ? 'text-green-400' : 'text-white'}`}>
                      Добавьте опыт работы
                    </div>
                    <div className="text-xs text-slate-400">Количество лет практики</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/medic/profile')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  profileProgress.hasCity
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-white/5 border-white/10 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    profileProgress.hasCity ? 'bg-green-500' : 'bg-white/10'
                  }`}>
                    {profileProgress.hasCity ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-slate-400">3</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${profileProgress.hasCity ? 'text-green-400' : 'text-white'}`}>
                      Выберите город работы
                    </div>
                    <div className="text-xs text-slate-400">В каком городе работаете</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/medic/profile')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  profileProgress.hasAreas
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-white/5 border-white/10 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    profileProgress.hasAreas ? 'bg-green-500' : 'bg-white/10'
                  }`}>
                    {profileProgress.hasAreas ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-slate-400">4</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${profileProgress.hasAreas ? 'text-green-400' : 'text-white'}`}>
                      Выберите районы работы
                    </div>
                    <div className="text-xs text-slate-400">В каких районах принимаете заказы</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/medic/profile')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  profileProgress.hasDocuments
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-white/5 border-white/10 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    profileProgress.hasDocuments ? 'bg-green-500' : 'bg-white/10'
                  }`}>
                    {profileProgress.hasDocuments ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-slate-400">4</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${profileProgress.hasDocuments ? 'text-green-400' : 'text-white'}`}>
                      Загрузите документы
                    </div>
                    <div className="text-xs text-slate-400">Лицензия и сертификаты</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/medic/profile')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  profileProgress.hasTelegram
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-white/5 border-white/10 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    profileProgress.hasTelegram ? 'bg-green-500' : 'bg-white/10'
                  }`}>
                    {profileProgress.hasTelegram ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-slate-400">5</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${profileProgress.hasTelegram ? 'text-green-400' : 'text-white'}`}>
                      Подключите Telegram
                    </div>
                    <div className="text-xs text-slate-400">Получайте уведомления о заказах</div>
                  </div>
                </div>
              </button>
            </div>

            {/* CTA кнопка */}
            <button
              onClick={() => router.push('/medic/profile')}
              className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold shadow-lg transition-all flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Перейти в профиль
            </button>
          </div>
        )}

        {/* Этот div (max-w-7xl) был лишним, так как он дублировал 
          тот, что на строке 176. Я его удалил, но оставил 
          div для Stats и Tabs. 
        */}
        
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-4">
            <div className="text-2xl font-bold text-cyan-400">{medicInfo?.ratingAvg?.toFixed(1) || '0.0'} ⭐</div>
            <div className="text-xs text-slate-400 mt-1">{t('medic.rating')}</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-4">
            <div className="text-2xl font-bold text-blue-400">{medicInfo?.reviewsCount || 0}</div>
            <div className="text-xs text-slate-400 mt-1">{t('medic.reviews')}</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-4">
            <div className="text-2xl font-bold text-green-400">{myOrders.filter(o => o.status === 'PAID').length}</div>
            <div className="text-xs text-slate-400 mt-1">{t('dashboard.completedOrders')}</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-4">
            <div className="text-2xl font-bold text-purple-400">{activeTab === 'available' ? realOrders.length : myOrders.length}</div>
            <div className="text-xs text-slate-400 mt-1">{activeTab === 'available' ? t('dashboard.availableOrders') : t('dashboard.activeOrders')}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'available'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {t('dashboard.availableOrders')} ({realOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'my'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {t('nav.myOrders')} ({myOrders.length})
          </button>
        </div>

        {/* Available Orders */}
        {activeTab === 'available' && (
          <div className="space-y-4 animate-slide-in">
            {ordersLoading ? (
              <div className="space-y-4">
                <OrderSkeleton />
                <OrderSkeleton />
                <OrderSkeleton />
              </div>
            ) : realOrders.length === 0 ? (
              <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-12 text-center">
                <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('order.noOrders')}</h3>
                <p className="text-slate-400">Новые заказы появятся здесь автоматически</p>
              </div>
            ) : (
              realOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-4 sm:p-6 hover:border-cyan-500/50 transition-all shadow-xl"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl sm:text-3xl shadow-lg flex-shrink-0">
                        💉
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-base sm:text-xl mb-1 truncate">{order.serviceType}</div>
                        <div className="text-xs text-slate-400">
                          {new Date(order.createdAt).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Цена */}
                    {order.price && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-slate-400 mb-1">Цена</div>
                        <div className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent whitespace-nowrap">
                          {parseInt(order.price).toLocaleString('ru-RU')} ₸
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info Grid - улучшенный для мобилки */}
                  <div className="space-y-3 mb-4">
                    {/* Клиент */}
                    <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-slate-400 mb-0.5">{t('order.client')}</div>
                          <div className="font-semibold text-sm sm:text-base truncate">{order.client?.name}</div>
                          <a 
                            href={`tel:${order.client?.phone}`}
                            className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300"
                          >
                            {order.client?.phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Время и Адрес в один ряд на десктопе */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Время */}
                      <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-slate-400 mb-0.5">{t('order.scheduledTime')}</div>
                            <div className="font-semibold text-sm sm:text-base">
                              {new Date(order.scheduledTime).toLocaleString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Адрес */}
                      <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-slate-400 mb-0.5">{t('order.address')}</div>
                            <div className="font-semibold text-xs sm:text-sm text-blue-400 truncate">{order.city}</div>
                            <div className="font-medium text-xs sm:text-sm truncate">{order.district}</div>
                            <div className="text-xs text-slate-300 mt-0.5 line-clamp-2">{order.address}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Комментарий */}
                  {order.comment && (
                    <div className="mb-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-yellow-400 font-semibold mb-1">{t('order.comment')}</div>
                          <div className="text-xs sm:text-sm text-slate-200 line-clamp-3">{order.comment}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Процедуры */}
                  {order.procedures && order.procedures.length > 0 && (
                    <div className="mb-4 p-3 sm:p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">📋</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-purple-400 font-semibold mb-2">{t('order.procedures')}</div>
                          <ProcedureList procedures={order.procedures} compact={true} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Кнопка принять */}
                  <button
                    onClick={() => handleAcceptOrder(order.id)}
                    className="w-full py-3 sm:py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-bold text-base sm:text-lg shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center group active:scale-95"
                  >
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 group-hover:scale-110 transition-transform" />
                    {t('order.createOrder')}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* My Orders */}
        {activeTab === 'my' && (
          <div className="space-y-4 animate-slide-in">
            {myOrders.length === 0 ? (
              <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-12 text-center">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('order.noOrders')}</h3>
                <p className="text-slate-400">Принятые заказы появятся здесь</p>
              </div>
            ) : (
              myOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-4 sm:p-6"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                        💉
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm sm:text-lg truncate">{order.serviceType}</div>
                        <div className="text-xs text-slate-400">#{order.id.substring(0, 8)}</div>
                      </div>
                    </div>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  {/* Info Grid - компактный для мобилки */}
                  <div className="space-y-3 mb-4">
                    {/* Клиент */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-slate-400 mb-0.5">Клиент</div>
                          <div className="font-medium text-sm sm:text-base truncate">{order.client?.name}</div>
                          <a 
                            href={`tel:${order.client?.phone}`}
                            className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300"
                          >
                            {order.client?.phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Адрес */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-slate-400 mb-0.5">Адрес</div>
                          <div className="font-bold text-xs sm:text-sm text-cyan-400 truncate">{order.city}</div> 
                          <div className="font-medium text-xs sm:text-sm truncate">{order.district}</div>
                          <div className="text-xs text-slate-300 mt-0.5 line-clamp-2">{order.address}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Цена */}
                  {order.price && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            💰
                          </div>
                          <span className="text-xs sm:text-sm text-slate-400">{t('order.price')}</span>
                        </div>
                        <span className="text-lg sm:text-xl font-bold text-emerald-400 whitespace-nowrap">
                          {parseInt(order.price).toLocaleString('ru-RU')} ₸
                        </span>
                      </div>
                    </div>
                  )}

                 {/* Комментарий */}
                  {order.comment && (
                    <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                      <div className="flex items-start space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-3.5 h-3.5 text-yellow-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-yellow-400 font-semibold mb-1">{t('order.comment')}</div>
                          <div className="text-xs sm:text-sm text-slate-200 line-clamp-3">{order.comment}</div>
                        </div>
                      </div>
                    </div>
                  )} 

                  {/* Процедуры */}
                  {order.procedures && order.procedures.length > 0 && (
                    <div className="mb-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                      <div className="flex items-start space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">📋</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-purple-400 font-semibold mb-2">Процедуры</div>
                          <ProcedureList procedures={order.procedures} compact={true} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Кнопки действий */}
                  <div className="space-y-2">
                    {/* Чат */}
                    <button
                      onClick={() => router.push(`/chat/${order.id}`)}
                      className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold text-sm sm:text-base transition-all flex items-center justify-center relative"
                    >
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      {t('nav.chat')}
                      {order.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                          {order.unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Ожидание подтверждения */}
                    {order.status === 'ACCEPTED' && !order.confirmedByClient && (
                      <div className="w-full p-3 sm:p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                        <div className="text-yellow-400 font-medium text-sm sm:text-base mb-1">⏳ Ожидание</div>
                        <div className="text-xs text-slate-400">
                          Клиент подтверждает
                        </div>
                      </div>
                    )}

                    {/* Я выехал */}
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'ON_THE_WAY')}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center active:scale-95"
                      >
                        <Car className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Я выезжаю
                      </button>
                    )}

                    {/* Я на месте */}
                    {order.status === 'ON_THE_WAY' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'STARTED')}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center active:scale-95"
                      >
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Я на месте
                      </button>
                    )}

                    {/* Завершить визит */}
                    {order.status === 'STARTED' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'COMPLETED')}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center active:scale-95"
                      >
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Завершить
                      </button>
                    )}

                    {/* Оплата получена */}
                    {order.status === 'COMPLETED' && (
                      <button
                        onClick={() => handlePaymentReceived(order.id)}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center active:scale-95"
                      >
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Оплата получена
                      </button>
                    )}

                    {/* Завершено */}
                    {order.status === 'PAID' && (
                      <div className="w-full p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                        <div className="text-sm text-emerald-400 font-medium">
                          ✓ Завершён и оплачен
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div> 
      
    </div> 
  );
}