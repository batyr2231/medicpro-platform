"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { MessageSquare } from 'lucide-react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [socket, setSocket] = useState<Socket | null>(null);

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
      console.log('🔌 ClientLayout: Connecting...');
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('✅ ClientLayout: Connected');
        newSocket.emit('authenticate', token);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ ClientLayout: Disconnected');
      });


      // ✅ УВЕДОМЛЕНИЯ О НОВЫХ СООБЩЕНИЯХ В ЧАТАХ
      newSocket.on('new-chat-message', (notification: any) => {
        console.log('💬 New chat message notification:', notification);

        // ✅ ПРОВЕРКА: Не показываем уведомление если мы УЖЕ В ЭТОМ ЧАТЕ!
        if (pathname === `/chat/${notification.orderId}`) {
          console.log('⚠️ Already in this chat, skipping notification');
          return; // ← Выходим, не показываем уведомление
        }

        // ✅ ВОСПРОИЗВОДИМ ЗВУК
        (window as any).playNotificationSound?.();

        // Показываем кликабельный toast
        toast.custom(
          (t) => (
            <div
              onClick={() => {
                router.push(`/chat/${notification.orderId}`);
                toast.dismiss(t.id);
              }}
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl rounded-2xl pointer-events-auto flex cursor-pointer hover:scale-105 transition-transform border-2 border-cyan-500/50`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-bold text-white">
                      💬 {notification.senderName}
                    </p>
                    <p className="mt-1 text-sm text-slate-300 line-clamp-2">
                      {notification.text}
                    </p>
                    <p className="mt-2 text-xs text-cyan-400 font-medium">
                      👆 Нажмите чтобы открыть чат
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
                  className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
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

      // ✅ УВЕДОМЛЕНИЯ О СМЕНЕ СТАТУСА ЗАКАЗА
      newSocket.on('order-status-changed', (data: any) => {
        console.log('📢 Order status changed:', data);
        
        // ✅ ВОСПРОИЗВОДИМ ЗВУК
        (window as any).playNotificationSound?.();
        
        const statusText = getStatusText(data.newStatus);
        toast.success(`📢 ${statusText}`, {
          duration: 5000,
          icon: '🔔',
        });
      });

      // ✅ УВЕДОМЛЕНИЕ О ПРИНЯТИИ ЗАКАЗА
      newSocket.on('order-accepted', (order: any) => {
        console.log('✅ Order accepted:', order);
        
        // ✅ ВОСПРОИЗВОДИМ ЗВУК
        (window as any).playNotificationSound?.();
        
        toast.success(`✅ Медик ${order.medic?.name || 'принял'} ваш заказ!`, {
          duration: 6000,
          icon: '🎉',
        });
      });

      setSocket(newSocket);

      return () => {
        console.log('🧹 ClientLayout: Cleaning up...');
        newSocket.disconnect();
      };
    } catch (error) {
      console.error('❌ ClientLayout error:', error);
    }
  }, []); // ← Пустой массив = выполняется 1 раз при монтировании

  const getStatusText = (status: string) => {
    const statuses: Record<string, string> = {
      'ACCEPTED': 'Медик принял заказ',
      'CONFIRMED': 'Медик подтверждён',
      'ON_THE_WAY': 'Медик в пути 🚗',
      'STARTED': 'Визит начался 🏥',
      'COMPLETED': 'Визит завершён 🎉',
      'PAID': 'Заказ оплачен 💰',
      'CANCELLED': 'Заказ отменён ❌',
    };
    return statuses[status] || status;
  };

  return <>{children}</>;
}