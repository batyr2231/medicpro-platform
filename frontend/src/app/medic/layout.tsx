"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { MessageSquare } from 'lucide-react';

// Функция воспроизведения звука уведомления
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
    
    console.log('🔔 Notification sound played');
  } catch (err) {
    console.error('Failed to play sound:', err);
  }
};

export default function MedicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'MEDIC') return;

      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('🔌 MedicLayout: Connecting...');
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('✅ MedicLayout: Connected');
        newSocket.emit('authenticate', token);
        
        if (user.id) {
          newSocket.emit('join', `user:${user.id}`);
          console.log(`📍 Joined personal room: user:${user.id}`);
        }

      // ✅ ЛОГИРУЕМ ЧТО СЛУШАТЕЛЬ ЗАРЕГИСТРИРОВАН
        console.log('👂 Listening for web-notification events');
      });

      newSocket.on('disconnect', () => {
        console.log('❌ MedicLayout: Disconnected');
      });
console.log('🎧 Registering web-notification listener');
      newSocket.on('new-chat-message', (notification: any) => {
        console.log('💬 Web notification received:', notification);
console.log('🔔 Event triggered!');

        if (pathname === `/chat/${notification.orderId}`) {
          console.log('⚠️ Already in this chat, skipping notification');
          return;
        }

        (window as any).playNotificationSound?.();

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
                      💬 {notification.senderName || 'Клиент'}
                    </p>
                    <p className="mt-1 text-sm text-slate-300 line-clamp-2">
                      {notification.message || notification.text || 'Новое сообщение'}
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

      newSocket.on('new-order', (order: any) => {
        console.log('🔔 New order received:', order);
        
        (window as any).playNotificationSound?.();
        
        toast.success('🔔 Новый заказ доступен!', {
          duration: 5000,
          icon: '💉',
        });
      });
      newSocket.onAny((eventName, ...args) => {
  console.log('🎯 Socket event received:', eventName, args);
});

      // Регистрируем функцию звука глобально
      (window as any).playNotificationSound = playNotificationSound;

      setSocket(newSocket);

      return () => {
        console.log('🧹 MedicLayout: Cleaning up...');
        newSocket.disconnect();
        delete (window as any).playNotificationSound;
      };
      
      
    } catch (error) {
      console.error('❌ MedicLayout error:', error);
    }
  }, []);
  

  return <>{children}</>;
}
