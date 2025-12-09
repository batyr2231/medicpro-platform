"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; 
import { ArrowLeft, MapPin, Clock, User, Phone, FileText, CheckCircle, Loader, AlertCircle, MessageSquare, X, Star } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation'; 
import { useOrders } from '../../../hooks/useOrders'; 
import { MEDICAL_PROCEDURES } from '@/utils/procedures';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  // ✅ ВСЕ useState ВВЕРХУ
  const [order, setOrder] = useState<any>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [medicId, setMedicId] = useState<string>('');
  
  const { getOrderById, loading } = useOrders();

  // ✅ useEffect для загрузки заказа
  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  // ✅ useEffect для загрузки medicId
  useEffect(() => {
    const fetchMedicId = async () => {
      if (!order?.medic?.id) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/medics/profile-by-user/${order.medic.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (response.ok) {
          const medicData = await response.json();
          setMedicId(medicData.id);
        }
      } catch (err) {
        console.error('Failed to get medicId:', err);
      }
    };

    fetchMedicId();
  }, [order?.medic?.id]);

  // ✅ ФУНКЦИИ
  const loadOrder = async () => {
    try {
      if (loading) return;

      const result = await getOrderById(orderId);
      setOrder(result);
      
      if (result.review) {
        setReviewSubmitted(true);
      } else {
        setReviewSubmitted(false);
      }
    } catch (err) {
      console.error('Failed to load order:', err);
    }
  };
  
  const handleUpdatePrice = async () => {
    if (!newPrice || parseFloat(newPrice) <= 0) {
      toast.error('Введите корректную цену');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${order.id}/price`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ price: newPrice }),
        }
      );

      if (!response.ok) throw new Error('Failed to update price');

      toast.success('✅ Цена обновлена');
      setEditingPrice(false);
      loadOrder();
    } catch (error: any) {
      console.error('Update price error:', error);
      toast.error('❌ Ошибка обновления цены');
    }
  };

  const getStatusInfo = (status: string) => {
    const info: Record<string, { text: string; icon: string; color: string; description: string }> = {
      NEW: {
        text: 'Ищем медика',
        icon: '🔍',
        color: 'text-blue-400',
        description: 'Ваш заказ отправлен медикам в вашем районе'
      },
      ACCEPTED: {
        text: 'Медик принял заказ',
        icon: '✅',
        color: 'text-cyan-400',
        description: 'Медик подтвердил и готовится выехать'
      },
      CONFIRMED: { // ← ДОБАВИТЬ!
      text: 'Медик подтверждён',
      icon: '✅',
      color: 'text-green-400',
      description: 'Ожидаем выезда медика'
    },
      ON_THE_WAY: {
        text: 'Медик в пути',
        icon: '🚗',
        color: 'text-purple-400',
        description: 'Медик едет к вам'
      },
      STARTED: {
        text: 'Медик на месте',
        icon: '🏥',
        color: 'text-yellow-400',
        description: 'Визит начался'
      },
      COMPLETED: {
        text: 'Визит завершён',
        icon: '🎉',
        color: 'text-green-400',
        description: 'Ожидается оплата'
      },
      PAID: {
        text: 'Оплачено',
        icon: '💰',
        color: 'text-emerald-400',
        description: 'Заказ полностью завершён'
      },
    };
    return info[status] || info.NEW;
  };

  // ✅ РАННИЕ ВЫХОДЫ
  if (loading && !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <div className="text-white">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-white mb-4">Заказ не найден</div>
          <button
            onClick={() => router.push('/client/orders')}
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 transition-all"
          >
            Вернуться к заказам
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const steps = ['NEW', 'ACCEPTED', 'CONFIRMED', 'ON_THE_WAY', 'STARTED', 'COMPLETED', 'PAID'];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button 
            onClick={() => router.push('/client/orders')}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>К заказам</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Card */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-4 sm:p-8 mb-6 shadow-xl">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{statusInfo.icon}</div>
            <h1 className={`text-3xl font-bold mb-2 ${statusInfo.color}`}>
              {statusInfo.text}
            </h1>
            <p className="text-slate-400">{statusInfo.description}</p>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <React.Fragment key={step}>
                <div className={`flex flex-col items-center ${index <= currentStepIndex ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all ${
                    index <= currentStepIndex 
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30' 
                      : 'bg-white/10 text-slate-500'
                  }`}>
                    {index < currentStepIndex ? '✓' : index + 1}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded transition-all ${
                    index < currentStepIndex ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-white/10'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-slate-400 mb-1">Создан</div>
              <div className="font-medium">{new Date(order.createdAt).toLocaleString('ru-RU')}</div>
            </div>
            {order.acceptedAt && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-slate-400 mb-1">Принят</div>
                <div className="font-medium">{new Date(order.acceptedAt).toLocaleString('ru-RU')}</div>
              </div>
            )}
            {order.completedAt && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-slate-400 mb-1">Завершён</div>
                <div className="font-medium">{new Date(order.completedAt).toLocaleString('ru-RU')}</div>
              </div>
            )}
            {!order.acceptedAt && <div className="p-3 rounded-xl bg-transparent"></div>}
            {order.acceptedAt && !order.completedAt && <div className="p-3 rounded-xl bg-transparent"></div>}
          </div>
        </div>

        {/* Order Info */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 mb-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4">Информация о заказе</h2>
          
          <div className="space-y-4">
             <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-2xl">
                💉
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Услуга</div>
                <div className="font-medium">{order.serviceType}</div>
              </div>
            </div>

            {/* ✅ НОВОЕ: Процедуры */}
            {order.procedures && order.procedures.length > 0 && (
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-2xl">
                  📋
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-400 mb-2">Процедуры</div>
                  <div className="space-y-2">
                    {order.procedures.map((proc: string, idx: number) => {
                      const procedure = MEDICAL_PROCEDURES.find(p => p.id === proc);
                      return (
                        <div key={idx} className="flex items-center space-x-2 text-sm">
                          <span className="text-lg">{procedure?.icon || '💊'}</span>
                          <span className="font-medium">{procedure?.name || proc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <MapPin className="w-10 h-10 p-2 rounded-lg bg-cyan-500/20 text-cyan-400 flex-shrink-0" />
              <div>
                <div className="text-sm text-slate-400 mb-1">Адрес</div>
                <div className="font-medium">{order.city}</div>
                <div className="font-medium">{order.district}</div>
                <div className="text-slate-300">{order.address}</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-10 h-10 p-2 rounded-lg bg-cyan-500/20 text-cyan-400 flex-shrink-0" />
              <div>
                <div className="text-sm text-slate-400 mb-1">Запланировано</div>
                <div className="font-medium">{new Date(order.scheduledTime).toLocaleString('ru-RU')}</div>
              </div>
            </div>

            {order.price ? (
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 p-2 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 text-xl">
                  💰
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-400 mb-1">Цена</div>
                  {editingPrice ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="Новая цена"
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white w-32"
                      />
                      <button
                        onClick={handleUpdatePrice}
                        className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-all text-sm"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setEditingPrice(false);
                          setNewPrice('');
                        }}
                        className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="font-medium text-green-400 text-lg">
                        {parseInt(order.price).toLocaleString('ru-RU')} тг
                      </div>
                      {order.status !== 'PAID' && (
                        <button
                          onClick={() => {
                            setEditingPrice(true);
                            setNewPrice(order.price?.toString() || '');
                          }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                        >
                          Изменить
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 p-2 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0 text-xl">
                  💰
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-400 mb-1">Цена</div>
                  {editingPrice ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="Введите цену"
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white w-32"
                      />
                      <button
                        onClick={handleUpdatePrice}
                        className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-all text-sm"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setEditingPrice(false);
                          setNewPrice('');
                        }}
                        className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingPrice(true)}
                      className="text-sm text-yellow-400 hover:text-yellow-300 underline"
                    >
                      + Добавить цену
                    </button>
                  )}
                </div>
              </div>
            )}
            {order.comment && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 mt-4">
                <div className="text-sm text-slate-400 mb-1">Комментарий</div>
                <div className="text-slate-300">{order.comment}</div>
              </div>
            )}
          </div>
        </div>
        

        {/* ✅ УЛУЧШЕННОЕ: Подтверждение медика для мобилки */}
        {order.status === 'ACCEPTED' && !order.confirmedByClient && (
          <div className="mb-6 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30">
            <div className="flex items-start space-x-3 sm:space-x-4 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg text-yellow-400 mb-2">
                  Подтвердите медика
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mb-4">
                  Медик принял ваш заказ. Ознакомьтесь с профилем.
                </p>
                
                {/* ✅ Компактная карточка медика */}
                <div className="bg-white/5 rounded-xl p-3 sm:p-4 mb-4 border border-white/10">
                  <div className="flex items-center space-x-3 mb-3">
                    {/* Аватар медика */}
                    {order.medic?.avatar ? (
                      <img
                        src={order.medic.avatar}
                        alt={order.medic.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-cyan-500/30 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0">
                        {order.medic?.name?.[0]}
                      </div>
                    )}
                    
                    {/* Информация о медике */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm sm:text-base text-white mb-0.5 truncate">
                        {order.medic?.name}
                      </div>
                      <div className="text-xs text-slate-400 mb-1">
                        Медицинский специалист
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="flex items-center text-yellow-400">
                          <Star className="w-3 h-3 mr-0.5" />
                          <span>5.0</span>
                        </div>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-400">50+ заказов</span>
                      </div>
                    </div>
                  </div>

                  {/* Контакты */}
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between py-2 border-t border-white/5">
                      <span className="text-slate-400">Телефон</span>
                      <a 
                        href={`tel:${order.medic?.phone}`} 
                        className="text-cyan-400 hover:text-cyan-300 flex items-center font-medium"
                      >
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="truncate">{order.medic?.phone}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* ✅ Кнопки для мобилки */}
                <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
                  {/* Подтвердить */}
                  <button
                    onClick={async () => {
                      if (!confirm('✅ Подтвердить этого медика?')) return;
                      
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(
                          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${order.id}/confirm`,
                          {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                            },
                          }
                        );

                        if (!response.ok) {
                          throw new Error('Failed to confirm');
                        }

                        const result = await response.json();
                        setOrder(result);
                        toast.success('✅ Медик подтверждён!');
                        
                      } catch (err) {
                        console.error('Confirm error:', err);
                        toast.error('❌ Ошибка подтверждения');
                      }
                    }}
                    className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 font-bold text-sm sm:text-base shadow-xl shadow-green-500/30 transition-all flex items-center justify-center active:scale-95"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Подтвердить
                  </button>

                  {/* Отклонить */}
                  <button
                    onClick={async () => {
                      if (!confirm('❌ Отклонить медика?')) return;
                      
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(
                          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${order.id}/reject-medic`,
                          {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                            },
                          }
                        );

                        if (!response.ok) {
                          throw new Error('Failed to reject');
                        }

                        const result = await response.json();
                        setOrder(result);
                        toast.success('✅ Ищем другого медика');
                        
                      } catch (err) {
                        console.error('Reject error:', err);
                        toast.error('❌ Ошибка отклонения');
                      }
                    }}
                    className="w-full py-3 sm:py-3.5 rounded-xl bg-red-500/20 border-2 border-red-500 text-red-400 hover:bg-red-500/30 hover:border-red-400 font-bold text-sm sm:text-base transition-all flex items-center justify-center active:scale-95"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Другого
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Информация о медике */}
        {order.medic && (
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 mb-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Ваш медик</h2>
            
            <div className="space-y-4">
              {/* Аватар и имя медика */}
              <div className="flex items-start space-x-4">
                {order.medic.avatar ? (
                  <img
                    src={order.medic.avatar}
                    alt={order.medic.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-cyan-500/30 shadow-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl font-bold shadow-lg flex-shrink-0">
                    {order.medic.name[0]}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-lg mb-1">{order.medic.name}</div>
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <User className="w-4 h-4" />
                    <span>Медицинский специалист</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-10 h-10 p-2 rounded-lg bg-green-500/20 text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-slate-400 mb-1">Телефон</div>
                  <div className="font-medium">{order.medic.phone}</div>
                </div>
              </div>

              {/* Кнопки связи */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {/* Позвонить */}
                <a
                  href={`tel:${order.medic.phone}`}
                  className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-all"
                >
                  <Phone className="w-5 h-5" />
                  <span className="text-sm font-medium">Позвонить</span>
                </a>

                {/* Чат */}
                <button
                  onClick={() => router.push(`/chat/${order.id}`)} 
                  className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-all"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-sm font-medium">Чат</span>
                </button>

                {/* Профиль медика - показываем только если medicId загружен */}
                {medicId && (
                  <button
                    onClick={() => {
                      sessionStorage.setItem('returnToOrder', order.id);
                      router.push(`/client/medics/${medicId}`);
                    }}
                    className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-all"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">Профиль</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Блок отзыва - показывается только если заказ завершён и НЕТ отзыва */}
        {(order.status === 'COMPLETED' || order.status === 'PAID') && !reviewSubmitted && (
          <button
            onClick={() => router.push(`/client/orders/${order.id}/review`)}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 font-semibold shadow-lg shadow-yellow-500/30 transition-all flex items-center justify-center text-lg mb-6"
          >
            ⭐ Оставить отзыв о медике
          </button>
        )}

        {/* Блок "Отзыв отправлен" */}
        {reviewSubmitted && (
          <div className="rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-2 border-green-500/30 p-6 backdrop-blur-xl mb-6 shadow-xl">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 88 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-400 mb-2">✅ Вы отправили отзыв!</h3>
                <p className="text-slate-300 text-sm">
                  Спасибо за ваш отзыв! Он поможет другим пользователям сделать правильный выбор.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Кнопка отмены - только для NEW заказов */}
        {order.status === 'NEW' && (
          <button
            onClick={async () => {
              if (!confirm('❌ Отменить заказ? Это действие нельзя отменить.')) return;
              
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${order.id}/cancel`,
                  {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    },
                  }
                );

                if (!response.ok) {
                  throw new Error('Failed to cancel');
                }

                toast.success('✅ Заказ отменён');
                router.push('/client/orders');
                
              } catch (err) {
                console.error('Cancel error:', err);
                toast.error('❌ Ошибка отмены');
              }
            }}
            className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 font-semibold transition-all flex items-center justify-center"
          >
            <X className="w-5 h-5 mr-2" />
            Отменить заказ
          </button>
        )}
      </div>
    </div>
  );
}