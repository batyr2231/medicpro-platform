"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function NotificationListener() {
  const router = useRouter();
  const pathname = usePathname();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      console.log('⚠️ No token or user, skipping notification listener');
      return;
    }

    const user = JSON.parse(userStr);

    console.log('🔔 Starting notification listener for user:', user.id);
    
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Notification socket connected:', newSocket.id);
      newSocket.emit('authenticate', token);
    });

    newSocket.on('authenticated', () => {
      console.log('✅ Notification listener authenticated');
    });

    // 🔔 УВЕДОМЛЕНИЕ О НОВОМ СООБЩЕНИИ
    newSocket.on('new-chat-message', (data: any) => {
      console.log('💬 NEW MESSAGE NOTIFICATION RECEIVED:', data);
      
      // Проверяем что НЕ находимся в этом чате
      const isInChat = pathname === `/chat/${data.orderId}`;
      
      console.log('📍 Current path:', pathname);
      console.log('📍 Is in chat?', isInChat);
      
      if (!isInChat) {
        console.log('🎉 Showing custom notification');
        
        // Показываем кастомное уведомление
        setNotification(data);
        
        // Автоскрытие через 8 секунд
        setTimeout(() => {
          setNotification(null);
        }, 8000);

        // Звук
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.3;
          audio.play().catch((err) => {
            console.log('⚠️ Audio play failed (user interaction required):', err.message);
          });
        } catch (e) {
          console.log('⚠️ Audio error:', e);
        }
      } else {
        console.log('ℹ️ User is in chat, no notification needed');
      }
    });

    // 🔔 УВЕДОМЛЕНИЕ О СМЕНЕ СТАТУСА
    newSocket.on('order-status-changed', (data: any) => {
      console.log('📢 ORDER STATUS CHANGED:', data);
      
      const statusText = getStatusText(data.newStatus);
      
      setNotification({
        type: 'status',
        orderId: data.orderId,
        text: statusText,
      });
      
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Notification socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Disconnecting notification listener...');
      newSocket.disconnect();
    };
  }, [pathname]);

  const getStatusText = (status: string) => {
    const statuses: Record<string, string> = {
      'ACCEPTED': 'Медик принял заказ ✅',
      'ON_THE_WAY': 'Медик в пути 🚗',
      'STARTED': 'Визит начался 🏥',
      'COMPLETED': 'Визит завершён 🎉',
      'PAID': 'Оплачено 💰',
      'CANCELLED': 'Отменён ❌',
    };
    return statuses[status] || status;
  };

  const handleClose = () => {
    setNotification(null);
  };

  const handleClick = () => {
    if (notification?.orderId) {
      console.log('👆 Notification clicked, navigating to chat:', notification.orderId);
      router.push(`/chat/${notification.orderId}`);
      setNotification(null);
    }
  };

  if (!notification) return null;

  const messagePreview = notification.text && notification.text.length > 40 
    ? notification.text.substring(0, 40) + '...' 
    : (notification.text || (notification.hasFile ? '📎 Файл' : 'Новое сообщение'));

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
      {notification.type === 'status' ? (
        // Уведомление о статусе
        <div
          onClick={handleClose}
          className="cursor-pointer bg-gradient-to-br from-green-600 to-emerald-700 border border-green-400/30 rounded-xl p-4 shadow-2xl max-w-sm"
        >
          <div className="flex items-start space-x-3">
            <div className="text-2xl">🔔</div>
            <div className="flex-1">
              <div className="font-semibold text-white text-sm">
                📢 Заказ #{notification.orderId.slice(0, 8)}
              </div>
              <div className="text-white/90 text-sm mt-1">
                {notification.text}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        // Уведомление о сообщении
        <div
          onClick={handleClick}
          className="cursor-pointer bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 rounded-xl p-4 shadow-2xl max-w-sm hover:border-cyan-400/50 transition-all"
        >
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              {notification.senderName?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm mb-1">
                💬 {notification.senderName}
              </div>
              <div className="text-slate-300 text-sm mb-2 break-words">
                {messagePreview}
              </div>
              <div className="text-cyan-400 text-xs font-medium">
                👆 Нажмите чтобы открыть чат
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="text-slate-400 hover:text-white transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}