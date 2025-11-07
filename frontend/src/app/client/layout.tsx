"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Подключаемся к Socket.IO
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to notifications');
      const token = localStorage.getItem('token');
      newSocket.emit('authenticate', token);
    });

    // Уведомление о смене статуса заказа
    newSocket.on('order-status-changed', (data: any) => {
      console.log('📢 Order status changed:', data);
      
      const statusText = getStatusText(data.newStatus);
      toast.success(`📢 Заказ #${data.orderId.slice(0, 8)}: ${statusText}`, {
        duration: 5000,
        icon: '🔔',
      });
    });

    // ← НОВОЕ: Уведомление о новом сообщении
    newSocket.on('new-chat-message', (data: any) => {
      console.log('💬 New chat message:', data);
      
      // Проверяем, что пользователь НЕ на странице этого чата
      const isInChat = pathname === `/chat/${data.orderId}`;
      
      if (!isInChat) {
        const messageText = data.text.length > 30 
          ? data.text.substring(0, 30) + '...' 
          : data.text;
        
        toast((t) => (
          <div 
            onClick={() => {
              toast.dismiss(t.id);
              router.push(`/chat/${data.orderId}`);
            }}
            className="cursor-pointer"
          >
            <div className="font-semibold">💬 {data.senderName}</div>
            <div className="text-sm text-slate-600">{messageText}</div>
            <div className="text-xs text-blue-600 mt-1">Нажмите чтобы открыть</div>
          </div>
        ), {
          duration: 6000,
          icon: '💬',
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [pathname, router]);

  const getStatusText = (status: string) => {
    const statuses: Record<string, string> = {
      'ACCEPTED': 'Медик принял заказ',
      'ON_THE_WAY': 'Медик в пути',
      'STARTED': 'Визит начался',
      'COMPLETED': 'Визит завершён',
      'PAID': 'Оплачено',
      'CANCELLED': 'Отменён',
    };
    return statuses[status] || status;
  };

  return <>{children}</>;
}