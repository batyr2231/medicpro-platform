"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

export default function NotificationListener() {
  const router = useRouter();
  const pathname = usePathname();
  const [socket, setSocket] = useState<Socket | null>(null);

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
      console.log('📍 Order chat path:', `/chat/${data.orderId}`);
      console.log('📍 Is in chat?', isInChat);
      
      if (!isInChat) {
        const messagePreview = data.text && data.text.length > 40 
          ? data.text.substring(0, 40) + '...' 
          : (data.text || (data.hasFile ? '📎 Файл' : 'Новое сообщение'));
        
        console.log('🎉 Showing toast notification');
        
        toast(
          (t) => (
            <div 
              onClick={() => {
                console.log('👆 Toast clicked, navigating to chat:', data.orderId);
                toast.dismiss(t.id);
                router.push(`/chat/${data.orderId}`);
              }}
              className="cursor-pointer"
              style={{ width: '100%' }}
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {data.senderName?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white mb-1">
                    💬 {data.senderName}
                  </div>
                  <div className="text-sm text-slate-300 mb-2 break-words">
                    {messagePreview}
                  </div>
                  <div className="text-xs text-cyan-400 font-medium">
                    👆 Нажмите чтобы открыть чат
                  </div>
                </div>
              </div>
            </div>
          ),
          {
            duration: 8000,
            position: 'top-right',
            style: {
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              maxWidth: '400px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            },
          }
        );

        // Звук (опционально)
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch (e) {}
      } else {
        console.log('ℹ️ User is in chat, no toast needed');
      }
    });

    // 🔔 УВЕДОМЛЕНИЕ О СМЕНЕ СТАТУСА ЗАКАЗА
    newSocket.on('order-status-changed', (data: any) => {
      console.log('📢 ORDER STATUS CHANGED:', data);
      
      const statusText = getStatusText(data.newStatus);
      
      toast.success(
        `📢 Заказ #${data.orderId.slice(0, 8)}\n${statusText}`,
        {
          duration: 5000,
          position: 'top-right',
          icon: '🔔',
        }
      );
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Notification socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Disconnecting notification listener...');
      newSocket.disconnect();
    };
  }, [pathname, router]);

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

  return null; // Компонент невидимый
}