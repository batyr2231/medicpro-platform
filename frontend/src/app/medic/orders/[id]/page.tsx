"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Clock, Phone,DollarSign, MessageSquare, CheckCircle, Loader } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';


export default function MedicOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const result = await response.json();

      if (response.ok) {
        setOrder(result);
      } else {
        toast.error('Не удалось загрузить заказ');
        router.push('/medic/dashboard');
      }
    } catch (error) {
      console.error('Load order error:', error);
      toast.error('Ошибка загрузки заказа');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/accept`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        toast.success('✅ Заказ принят!');
        loadOrder();
      } else {
        const result = await response.json();
        toast.error('❌ ' + result.error);
      }
    } catch (error) {
      console.error('Accept order error:', error);
      toast.error('Ошибка принятия заказа');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <Loader className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Заказ не найден</h2>
          <button
            onClick={() => router.push('/medic/dashboard')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/medic/dashboard')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Детали заказа</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Order Info */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">{order.serviceType}</h2>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <span className="text-slate-300">{order.district}, {order.address}</span>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span className="text-slate-300">
                {new Date(order.scheduledTime).toLocaleString('ru-RU')}
              </span>
            </div>

            {order.price && (
                <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <div>
                    <span className="text-slate-400 text-sm">Цена: </span>
                    <span className="text-green-400 font-bold text-lg">
                    {parseInt(order.price).toLocaleString('ru-RU')} тг
                    </span>
                </div>
                </div>
            )}

            {order.comment && (
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-sm text-slate-400 mb-1">Комментарий:</div>
                <div className="text-slate-300">{order.comment}</div>
              </div>
            )}
            {order.price && (
            <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">Предполагаемая цена:</div>
                <div className="text-2xl font-bold text-green-400">
                    {parseInt(order.price).toLocaleString('ru-RU')} тг
                </div>
                </div>
                <div className="text-xs text-slate-400 mt-2">
                * Окончательная цена согласовывается с клиентом
                </div>
            </div>
            )}
          </div>
        </div>


        {/* Client Info */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Информация о клиенте</h3>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-lg font-bold">
              {order.client?.name?.[0] || 'К'}
            </div>
            <div>
              <div className="font-medium">{order.client?.name || 'Клиент'}</div>
              <div className="text-sm text-slate-400 flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>{order.client?.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {order.status === 'NEW' && (
            <button
              onClick={handleAccept}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 font-semibold shadow-lg transition-all flex items-center justify-center text-lg"
            >
              <CheckCircle className="w-6 h-6 mr-2" />
              Принять заказ
            </button>
          )}

          {order.status !== 'NEW' && (
            <button
              onClick={() => router.push(`/chat/${order.id}`)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold shadow-lg transition-all flex items-center justify-center text-lg"
            >
              <MessageSquare className="w-6 h-6 mr-2" />
              Открыть чат
            </button>
          )}
        </div>
      </div>
    </div>
  );
}