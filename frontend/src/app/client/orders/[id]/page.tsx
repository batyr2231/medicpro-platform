"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Clock, User, MessageSquare, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useOrders } from '../../../hooks/useOrders';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const { getOrderById, loading } = useOrders();

  useEffect(() => {
    loadOrder();
    
    // Обновляем каждые 5 секунд
    const interval = setInterval(loadOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const result = await getOrderById(orderId);
      setOrder(result);
    } catch (err) {
      console.error('Failed to load order:', err);
    }
  };

  const handleLogout = () => {
    if (confirm('Вы уверены что хотите выйти?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/auth');
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
  const steps = ['NEW', 'ACCEPTED', 'ON_THE_WAY', 'STARTED', 'COMPLETED', 'PAID'];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
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
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 mb-6">
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    index <= currentStepIndex 
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg' 
                      : 'bg-white/10 text-slate-500'
                  }`}>
                    {index < currentStepIndex ? '✓' : index + 1}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-all ${
                    index < currentStepIndex ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-white/10'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-xl bg-white/5">
              <div className="text-slate-400 mb-1">Создан</div>
              <div className="font-medium">{new Date(order.createdAt).toLocaleString('ru-RU')}</div>
            </div>
            {order.acceptedAt && (
              <div className="p-3 rounded-xl bg-white/5">
                <div className="text-slate-400 mb-1">Принят</div>
                <div className="font-medium">{new Date(order.acceptedAt).toLocaleString('ru-RU')}</div>
              </div>
            )}
            {order.completedAt && (
              <div className="p-3 rounded-xl bg-white/5">
                <div className="text-slate-400 mb-1">Завершён</div>
                <div className="font-medium">{new Date(order.completedAt).toLocaleString('ru-RU')}</div>
              </div>
            )}
          </div>
        </div>

        {/* Order Info */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Информация о заказе</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                💉
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Услуга</div>
                <div className="font-medium">{order.serviceType}</div>
              </div>
            </div>

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

            {order.price && (
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 p-2 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  💰
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Цена</div>
                  <div className="font-medium text-green-400 text-lg">
                    {parseInt(order.price).toLocaleString('ru-RU')} тг
                  </div>
                </div>
              </div>
            )}

            {order.comment && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-sm text-slate-400 mb-1">Комментарий</div>
                <div className="text-slate-300">{order.comment}</div>
              </div>
            )}
          </div>
        </div>

        {/* Medic Info */}
        {order.medic && (
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Ваш медик</h2>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl font-bold">
                  {order.medic.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-lg">{order.medic.name}</div>
                  <div className="text-slate-400">{order.medic.phone}</div>
                </div>
              </div>

              <button
                onClick={() => router.push(`/chat/${order.id}`)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold shadow-lg transition-all flex items-center"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Чат
              </button>
            </div>
          </div>
        )}

        {/* Review Button */}
        {order.status === 'PAID' && !order.review && (
          <button
            onClick={() => router.push(`/client/orders/${order.id}/review`)}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 font-semibold shadow-lg transition-all flex items-center justify-center text-lg"
          >
            ⭐ Оставить отзыв о медике
          </button>
        )}

        {/* Cancel Button */}
        {order.status === 'NEW' && (
          <button
            onClick={async () => {
              if (!confirm('Вы уверены что хотите отменить заказ?')) return;
              
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${order.id}/cancel`,
                  {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                  }
                );

                if (response.ok) {
                  alert('✅ Заказ отменён');
                  router.push('/client/orders');
                } else {
                  const result = await response.json();
                  alert('❌ ' + result.error);
                }
              } catch (error) {
                alert('❌ Ошибка отмены заказа');
              }
            }}
            className="w-full py-4 rounded-xl bg-red-500/20 border-2 border-red-500 hover:bg-red-500/30 font-semibold transition-all flex items-center justify-center text-lg text-red-400"
          >
            ❌ Отменить заказ
          </button>
        )} 
      </div>
    </div>
  );
}