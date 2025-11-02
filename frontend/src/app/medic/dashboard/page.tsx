"use client";

import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Clock, User, Phone, FileText, CheckCircle, Navigation, AlertCircle, Menu, Loader, Car, Play, DollarSign, MessageSquare } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function MedicDashboard() {
  const [activeTab, setActiveTab] = useState('available');
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
    }, 30000);
    
    return () => clearInterval(interval);
  }, [activeTab]);

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
      ACCEPTED: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
      ON_THE_WAY: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
      STARTED: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
      COMPLETED: 'bg-green-500/20 border-green-500/30 text-green-400',
      PAID: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    };
    return colors[status] || 'bg-slate-500/20 border-slate-500/30 text-slate-400';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      ACCEPTED: 'Принят',
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Heart className="w-6 h-6" />
              </div>
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

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <span className="text-sm">Выйти</span>
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
            <div className="text-xs text-slate-400 mt-1">Рейтинг</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-4">
            <div className="text-2xl font-bold text-blue-400">{medicInfo?.reviewsCount || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Отзывов</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-4">
            <div className="text-2xl font-bold text-green-400">{myOrders.filter(o => o.status === 'PAID').length}</div>
            <div className="text-xs text-slate-400 mt-1">Завершено</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-4">
            <div className="text-2xl font-bold text-purple-400">{activeTab === 'available' ? realOrders.length : myOrders.length}</div>
            <div className="text-xs text-slate-400 mt-1">{activeTab === 'available' ? 'Доступно' : 'Активных'}</div>
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
            Доступные ({realOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'my'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Мои заказы ({myOrders.length})
          </button>
        </div>

        {/* Available Orders */}
        {activeTab === 'available' && (
          <div className="space-y-4 animate-slide-in">
            {ordersLoading ? (
              <div className="text-center py-12">
                <Loader className="inline-block w-8 h-8 text-cyan-500 animate-spin" />
                <div className="mt-4 text-slate-400">Загрузка заказов...</div>
              </div>
            ) : realOrders.length === 0 ? (
              <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-12 text-center">
                <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Нет доступных заказов</h3>
                <p className="text-slate-400">Новые заказы появятся здесь автоматически</p>
              </div>
            ) : (
              realOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-2xl">
                        💉
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{order.serviceType}</div>
                        <div className="text-xs text-slate-400">
                          {new Date(order.createdAt).toLocaleString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-slate-400 mb-1">Клиент</div>
                        <div className="font-medium truncate">{order.client?.name}</div>
                        <div className="text-sm text-slate-300">{order.client?.phone}</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Время</div>
                        <div className="font-medium">
                          {new Date(order.scheduledTime).toLocaleString('ru-RU')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 sm:col-span-2">
                      <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-slate-400 mb-1">Адрес</div>
                        <div className="font-medium">{order.city}</div>
                        <div className="font-medium">{order.district}</div>
                        <div className="text-sm text-slate-300">{order.address}</div>
                      </div>
                    </div>
                  </div>

                  {order.comment && (
                    <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-start space-x-2">
                        <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Комментарий</div>
                          <div className="text-sm text-slate-300">{order.comment}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {order.price && (
                    <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-5 h-5 text-green-400" />
                          <span className="text-sm text-slate-400">Предполагаемая цена:</span>
                        </div>
                        <span className="text-xl font-bold text-green-400">
                          {parseInt(order.price).toLocaleString('ru-RU')} тг
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Принять заказ
                    </button>
                  </div>
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
                <h3 className="text-xl font-semibold mb-2">Нет активных заказов</h3>
                <p className="text-slate-400">Принятые заказы появятся здесь</p>
              </div>
            ) : (
              myOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl">
                        💉
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{order.serviceType}</div>
                        <div className="text-xs text-slate-400">#{order.id.substring(0, 8)}</div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Клиент</div>
                        <div className="font-medium">{order.client?.name}</div>
                        <div className="text-sm text-slate-300">{order.client?.phone}</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Адрес</div>
                        <div className="font-bold text-cyan-400">{order.city}</div> 
                        <div className="font-medium">{order.district}</div>
                        <div className="text-sm text-slate-300">{order.address}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => router.push(`/chat/${order.id}`)}
                      className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold transition-all flex items-center justify-center"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Открыть чат
                        {order.unreadCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {order.unreadCount}
                          </span>
                        )}
                    </button>

                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'ON_THE_WAY')}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 font-semibold shadow-lg transition-all flex items-center justify-center"
                      >
                        <Car className="w-5 h-5 mr-2" />
                        Я выехал
                      </button>
                    )}

                    {order.status === 'ON_THE_WAY' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'STARTED')}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 font-semibold shadow-lg transition-all flex items-center justify-center"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Я на месте
                      </button>
                    )}

                    {order.status === 'STARTED' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'COMPLETED')}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 font-semibold shadow-lg transition-all flex items-center justify-center"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Завершить визит
                      </button>
                    )}

                    {order.status === 'COMPLETED' && (
                      <button
                        onClick={() => handlePaymentReceived(order.id)}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 font-semibold shadow-lg transition-all flex items-center justify-center"
                      >
                        <DollarSign className="w-5 h-5 mr-2" />
                        Оплата получена
                      </button>
                    )}

                    {order.status === 'PAID' && (
                      <div className="w-full p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                        <div className="text-sm text-emerald-400 font-medium">
                          ✓ Заказ завершён и оплачен
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div> {/* <-- Этот div закрывает <div className="max-w-7xl mx-auto px-4 py-8"> */}
      
    </div> /* <-- ИСПРАВЛЕНИЕ: Этот недостающий </div> закрывает корневой <div className="min-h-screen..."> */
  );
}