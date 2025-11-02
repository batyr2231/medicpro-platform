"use client";

import { useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('authenticate', token);
    });

    // Глобальный слушатель для toast уведомлений
    socket.on('new-chat-message', (data: any) => {
      const { senderName, message, orderId } = data;
      
      toast((t) => (
        <div className="flex items-start space-x-3">
          <div className="flex-1">
            <div className="font-bold text-sm">💬 Новое сообщение</div>
            <div className="text-xs text-gray-600 mt-1">От: {senderName}</div>
            <div className="text-sm mt-1">{message.substring(0, 50)}...</div>
          </div>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              window.location.href = `/chat/${orderId}`;
            }}
            className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
          >
            Открыть
          </button>
        </div>
      ), {
        duration: 5000,
        position: 'top-right',
        icon: '💬',
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <html lang="ru">
      <body>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}