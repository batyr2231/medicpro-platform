"use client";

import React, { useState, useEffect } from 'react';
// 1. Добавил импорт 'toast' для уведомлений
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, Clock, User, Phone, FileText, CheckCircle, Loader, AlertCircle } from 'lucide-react';
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
    // 2. ЗАМЕНА: Заменил 'confirm' на 'toast' (confirm не работает в iframe)
    // Вы можете добавить кастомное модальное окно для подтверждения
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Вы вышли из системы');
    router.push('/auth');
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

        {/* Информация о медике */}
        {order.medic && (
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Ваш медик</h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <User className="w-10 h-10 p-2 rounded-lg bg-cyan-500/20 text-cyan-400 flex-shrink-0" />
                <div>
                  <div className="text-sm text-slate-400 mb-1">Медик</div>
                  <div className="font-medium">{order.medic.name}</div>
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
              <div className="grid grid-cols-2 gap-3 mt-4">
                {/* 3. ИСПРАВЛЕНИЕ: тег <a> был написан неверно */}
                <a
                  href={`tel:${order.medic.phone}`}
                  className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-all"
                >
                  <Phone className="w-5 h-5" />
                  <span className="text-sm font-medium">Позвонить</span>
                </a>

                {/* 4. ИСПРАВЛЕНИЕ: тег <a> был написан неверно */}
                <a
                  href={`https://wa.me/${order.medic.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="text-sm font-medium">WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Review Button */}
        {order.status === 'PAID' && !order.review && (
          <button
            onClick={() => router.push(`/client/orders/${order.id}/review`)}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 font-semibold shadow-lg transition-all flex items-center justify-center text-lg mb-6"
          >
            ⭐ Оставить отзыв о медике
          </button>
        )}

        {/* Cancel Button */}
        {order.status === 'NEW' && (
          <button
            // 5. ИСПРАВЛЕНИЕ: Заменил 'confirm' и 'alert' на 'toast'
            onClick={async () => {
              // Я убрал 'confirm', так как он блокирует UI.
              // В идеале, здесь нужно кастомное модальное окно.
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
                  toast.success('✅ Заказ отменён');
                  router.push('/client/orders');
                } else {
                  const result = await response.json();
                  toast.error('❌ ' + (result.error || 'Не удалось отменить'));
                }
              } catch (error) {
                toast.error('❌ Ошибка отмены заказа');
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
