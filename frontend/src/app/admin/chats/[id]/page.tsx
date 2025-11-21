"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, DollarSign, MessageSquare, Check, CheckCheck, Image as ImageIcon, FileText, Loader } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminChatViewer() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatData();
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [orderData?.messages]);

  const loadChatData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/chats/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load chat');
      }

      const result = await response.json();
      setOrderData(result);
    } catch (err) {
      console.error('Load chat error:', err);
      toast.error('Ошибка загрузки чата');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      ACCEPTED: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
      CONFIRMED: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
      ON_THE_WAY: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
      STARTED: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
      COMPLETED: 'bg-green-500/20 border-green-500/30 text-green-400',
      PAID: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    };
    return colors[status] || 'bg-slate-500/20 border-slate-500/30 text-slate-400';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      NEW: 'Новый',
      ACCEPTED: 'Принят',
      CONFIRMED: 'Подтверждён',
      ON_THE_WAY: 'В пути',
      STARTED: 'На месте',
      COMPLETED: 'Завершён',
      PAID: 'Оплачено',
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <div className="text-white">Загрузка чата...</div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Чат не найден</p>
          <button
            onClick={() => router.push('/admin')}
            className="mt-4 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 transition"
          >
            Вернуться
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к админ-панели</span>
          </button>

          <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(orderData.status)}`}>
            {getStatusText(orderData.status)}
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Левая колонка - информация о заказе */}
          <div className="lg:col-span-1 space-y-4">
            {/* Информация о заказе */}
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Информация о заказе
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-slate-400 mb-1">ID заказа</div>
                  <div className="font-mono">#{orderId.slice(0, 8)}</div>
                </div>

                <div>
                  <div className="text-slate-400 mb-1">Услуга</div>
                  <div className="font-medium">{orderData.serviceType}</div>
                </div>

                <div>
                  <div className="text-slate-400 mb-1">Адрес</div>
                  <div className="font-medium">
                    <div>{orderData.city}, {orderData.district}</div>
                    <div className="text-slate-300">{orderData.address}</div>
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 mb-1">Дата/время</div>
                  <div className="font-medium">
                    {new Date(orderData.scheduledTime).toLocaleString('ru-RU')}
                  </div>
                </div>

                {orderData.price && (
                  <div>
                    <div className="text-slate-400 mb-1">Цена</div>
                    <div className="font-bold text-emerald-400 text-lg">
                      {parseInt(orderData.price).toLocaleString('ru-RU')} ₸
                    </div>
                  </div>
                )}

                {orderData.comment && (
                  <div>
                    <div className="text-slate-400 mb-1">Комментарий</div>
                    <div className="text-slate-300">{orderData.comment}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Клиент */}
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Клиент
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-slate-400 mb-1">Имя</div>
                  <div className="font-medium">{orderData.client.name}</div>
                </div>

                <div>
                  <div className="text-slate-400 mb-1">Телефон</div>
                  <a href={`tel:${orderData.client.phone}`} className="font-medium text-cyan-400 hover:text-cyan-300">
                    {orderData.client.phone}
                  </a>
                </div>

                {orderData.client.email && (
                  <div>
                    <div className="text-slate-400 mb-1">Email</div>
                    <a href={`mailto:${orderData.client.email}`} className="font-medium text-cyan-400 hover:text-cyan-300">
                      {orderData.client.email}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Медик */}
            {orderData.medic && (
              <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Медик
                </h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-slate-400 mb-1">Имя</div>
                    <div className="font-medium">{orderData.medic.name}</div>
                  </div>

                  <div>
                    <div className="text-slate-400 mb-1">Телефон</div>
                    <a href={`tel:${orderData.medic.phone}`} className="font-medium text-cyan-400 hover:text-cyan-300">
                      {orderData.medic.phone}
                    </a>
                  </div>

                  {orderData.medic.email && (
                    <div>
                      <div className="text-slate-400 mb-1">Email</div>
                      <a href={`mailto:${orderData.medic.email}`} className="font-medium text-cyan-400 hover:text-cyan-300">
                        {orderData.medic.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Правая колонка - чат */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
              {/* Chat Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center">
                    <MessageSquare className="w-6 h-6 mr-2" />
                    История чата
                  </h2>
                  <div className="text-sm text-slate-400">
                    {orderData.messages.length} сообщений
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {orderData.messages.length === 0 ? (
                  <div className="text-center py-20">
                    <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">Нет сообщений в этом чате</p>
                  </div>
                ) : (
                  orderData.messages.map((msg: any) => {
                    const isClient = msg.from.role === 'CLIENT';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-md lg:max-w-lg ${isClient ? '' : 'text-right'}`}>
                          <div className="flex items-center space-x-2 mb-1">
                            {isClient && (
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                                {msg.from.name[0]}
                              </div>
                            )}
                            <div className="text-xs text-slate-400">
                              {msg.from.name} • {msg.from.role === 'CLIENT' ? 'Клиент' : 'Медик'}
                            </div>
                            {!isClient && (
                              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-xs font-bold">
                                {msg.from.name[0]}
                              </div>
                            )}
                          </div>

                          <div
                            className={`px-4 py-3 rounded-2xl ${
                              isClient
                                ? 'bg-white/10 border border-white/10 rounded-tl-sm'
                                : 'bg-gradient-to-br from-cyan-500 to-blue-600 rounded-tr-sm'
                            }`}
                          >
                            {msg.fileUrl && (
                              <div className="mb-2">
                                {msg.fileType?.startsWith('image/') ? (
                                  <img
                                    src={msg.fileUrl}
                                    alt="Attachment"
                                    className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(msg.fileUrl, '_blank')}
                                    style={{ maxWidth: '300px' }}
                                  />
                                ) : (
                                  <a
                                    href={msg.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                  >
                                    <FileText className="w-5 h-5" />
                                    <span className="text-sm">Открыть файл</span>
                                  </a>
                                )}
                              </div>
                            )}

                            {msg.text && (
                              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                {msg.text}
                              </div>
                            )}
                          </div>

                          <div className={`text-xs text-slate-500 mt-1 ${isClient ? '' : 'text-right'}`}>
                            {new Date(msg.createdAt).toLocaleString('ru-RU')}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}