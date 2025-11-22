'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ClientNotifications() {
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Проверяем что пользователь - клиент
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'CLIENT') return;

      const token = localStorage.getItem('token');
      if (!token) return;

      // Подключаемся к Socket.IO
      console.log('🔌 ClientNotifications: Connecting...');
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('✅ ClientNotifications: Connected');
        socket.emit('authenticate', token);
      });

      socket.on('disconnect', () => {
        console.log('❌ ClientNotifications: Disconnected');
      });

      // ✅ СЛУШАЕМ НОВЫЕ СООБЩЕНИЯ В ЧАТАХ
      socket.on('new-chat-message', (notification: any) => {
        console.log('💬 New chat message notification:', notification);

        // Воспроизводим звук
        (window as any).playNotificationSound?.();

        // Показываем toast с возможностью перейти в чат
        toast.custom(
          (t) => (
            <div
              onClick={() => {
                router.push(`/chat/${notification.orderId}`);
                toast.dismiss(t.id);
              }}
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-slate-800 shadow-lg rounded-2xl pointer-events-auto flex cursor-pointer hover:scale-105 transition-transform border border-cyan-500/30`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <MessageSquare className="h-10 w-10 text-cyan-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-white">
                      Новое сообщение от {notification.senderName}
                    </p>
                    <p className="mt-1 text-sm text-slate-300 line-clamp-2">
                      {notification.text}
                    </p>
                    <p className="mt-1 text-xs text-cyan-400 font-medium">
                      Нажмите чтобы открыть чат →
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-slate-700">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.dismiss(t.id);
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-slate-400 hover:text-slate-200 focus:outline-none"
                >
                  ✕
                </button>
              </div>
            </div>
          ),
          {
            duration: 8000,
            position: 'top-right',
          }
        );
      });

      // ✅ СЛУШАЕМ ИЗМЕНЕНИЕ СТАТУСА ЗАКАЗА
      socket.on('order-status-changed', (data: any) => {
        console.log('📦 Order status changed:', data);

        // Воспроизводим звук
        (window as any).playNotificationSound?.();

        const statusMessages: Record<string, string> = {
          ACCEPTED: '✅ Медик принял ваш заказ',
          CONFIRMED: '✅ Медик подтверждён и готовится выехать',
          ON_THE_WAY: '🚗 Медик в пути',
          STARTED: '🏥 Медик прибыл и начал визит',
          COMPLETED: '🎉 Визит завершён',
          PAID: '💰 Заказ оплачен',
        };

        const message = statusMessages[data.newStatus] || 'Статус заказа изменён';

        toast.success(message, {
          duration: 5000,
          icon: '📋',
        });
      });

      // ✅ СЛУШАЕМ ПРИНЯТИЕ ЗАКАЗА МЕДИКОМ
      socket.on('order-accepted', (order: any) => {
        console.log('✅ Order accepted:', order);

        // Воспроизводим звук
        (window as any).playNotificationSound?.();

        toast.success(`✅ Медик ${order.medic?.name || 'принял'} ваш заказ!`, {
          duration: 5000,
          icon: '🎉',
        });
      });

      // Cleanup
      return () => {
        console.log('🧹 ClientNotifications: Cleaning up...');
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    } catch (error) {
      console.error('❌ ClientNotifications error:', error);
    }
  }, [router]);

  return null; // Компонент невидимый
}