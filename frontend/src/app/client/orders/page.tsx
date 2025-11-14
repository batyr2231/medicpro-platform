"use client";

import React, { useState, useEffect } from 'react';
import { Package, Clock, MapPin, User, Phone, MessageSquare, Star, Plus, Search, ChevronRight, Loader, LogOut, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOrders } from '../../hooks/useOrders';
import OrderSkeleton from '@/components/OrderSkeleton';

export default function ClientOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const { getMyOrders, loading } = useOrders();
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const result = await getMyOrders();
      setOrders(result || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setOrders([]);
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
    const info: Record<string, { text: string; icon: string; color: string }> = {
      NEW: { text: 'Ищем медика', icon: '🔍', color: 'text-blue-400' },
      ACCEPTED: { text: 'Принят', icon: '✅', color: 'text-cyan-400' },
      ON_THE_WAY: { text: 'В пути', icon: '🚗', color: 'text-purple-400' },
      STARTED: { text: 'На месте', icon: '🏥', color: 'text-yellow-400' },
      COMPLETED: { text: 'Завершён', icon: '🎉', color: 'text-green-400' },
      PAID: { text: 'Оплачено', icon: '💰', color: 'text-emerald-400' },
    };
    return info[status] || info.NEW;
  };

  const HeaderContent = () => (
    <>
      {/* Desktop */}
      <div className="hidden md:flex items-center space-x-3">
        <button
          onClick={() => router.push('/client/profile')}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          title="Профиль"
        >
          <User className="w-5 h-5" />
        </button>
        <button
          onClick={() => router.push('/client/medics')}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center space-x-2"
        >
          <Search className="w-5 h-5" />
          <span>Каталог</span>
        </button>
        <button
          onClick={() => router.push('/orders/create')}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold transition-all flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Новый заказ</span>
        </button>
        <button
          onClick={handleLogout}
          className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
          title="Выйти"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile */}
      <div className="flex md:hidden items-center space-x-2">
        <button
          onClick={() => router.push('/orders/create')}
          className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all"
          title="Новый заказ"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
        <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                MedicPro
              </h1>
              <HeaderContent />
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="space-y-4">
            <OrderSkeleton />
            <OrderSkeleton />
            <OrderSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              MedicPro
            </h1>
            <HeaderContent />
          </div>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-2">
              <button
                onClick={() => {
                  router.push('/client/profile');
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <User className="w-5 h-5" />
                <span>Профиль</span>
              </button>
              <button
                onClick={() => {
                  router.push('/client/medics');
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <Search className="w-5 h-5" />
                <span>Каталог медиков</span>
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all text-left"
              >
                <LogOut className="w-5 h-5" />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Нет заказов</h2>
            <p className="text-slate-400 mb-6">Создайте свой первый заказ</p>
            <button
              onClick={() => router.push('/client/new-order')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold shadow-lg transition-all"
            >
              Создать заказ
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              
              return (
                <div
                  key={order.id}
                  className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-4 md:p-6 hover:border-cyan-500/50 transition-all cursor-pointer"
                  onClick={() => router.push(`/client/orders/${order.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="text-2xl md:text-3xl">{statusInfo.icon}</div>
                      <div>
                        <div className={`text-sm md:text-base font-semibold ${statusInfo.color}`}>
                          {statusInfo.text}
                        </div>
                        <div className="text-xs md:text-sm text-slate-400">
                          Заказ #{order.id.slice(0, 8)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs md:text-sm text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-xs md:text-sm">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-sm">
                        💉
                      </div>
                      <span className="text-slate-300">{order.serviceType}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs md:text-sm">
                      <MapPin className="w-5 h-5 md:w-6 md:h-6 p-1 rounded bg-cyan-500/20 text-cyan-400 flex-shrink-0" />
                      <span className="text-slate-300 line-clamp-1">{order.district}, {order.address}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs md:text-sm">
                      <Clock className="w-5 h-5 md:w-6 md:h-6 p-1 rounded bg-cyan-500/20 text-cyan-400 flex-shrink-0" />
                      <span className="text-slate-300">
                        {new Date(order.scheduledTime).toLocaleString('ru-RU')}
                      </span>
                    </div>

                    {order.price && (
                      <div className="flex items-center space-x-2 text-xs md:text-sm">
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-sm">
                          💰
                        </div>
                        <span className="text-emerald-400 font-semibold">
                          {parseInt(order.price).toLocaleString('ru-RU')} тг
                        </span>
                      </div>
                    )}
                  </div>

                  {order.medic && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
                      <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-sm md:text-base">
                          {order.medic.name[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm md:text-base truncate">{order.medic.name}</div>
                          <div className="text-xs text-slate-400 truncate">{order.medic.phone}</div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/chat/${order.id}`);
                        }}
                        className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors flex-shrink-0 ml-2"
                      >
                        <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  )}

                  {order.status === 'PAID' && (
                    order.review ? (
                      <div className="w-full py-2.5 md:py-3 px-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-medium text-center flex items-center justify-center space-x-2 text-sm md:text-base">
                        <Star className="w-4 h-4 md:w-5 md:h-5 fill-green-400" />
                        <span>Вы оставили отзыв</span>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/client/orders/${order.id}/review`);
                        }}
                        className="w-full py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 font-semibold shadow-lg transition-all flex items-center justify-center text-sm md:text-base"
                      >
                        <Star className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        Оставить отзыв
                      </button>
                    )
                  )}

                  <div className="flex items-center justify-end mt-4 text-cyan-400 text-xs md:text-sm font-medium">
                    Подробнее
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}