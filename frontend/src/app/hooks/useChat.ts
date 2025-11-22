"use client";

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useChat(orderId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    console.log('🔌 useChat: Starting...', { orderId }); // ← ДОБАВИТЬ

    // Проверка orderId
    if (!orderId) {
      console.error('❌ useChat: No orderId!'); // ← ДОБАВИТЬ
      setError('Order ID is required');
      setLoading(false);
      return;
    }

    // Получаем текущего пользователя
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.error('❌ useChat: No user!'); // ← ДОБАВИТЬ
      setError('User not found');
      setLoading(false);
      return;
    }

    const user = JSON.parse(userStr);
    setCurrentUserId(user.id);
    console.log('👤 useChat: Current user:', user.id); // ← ДОБАВИТЬ

    // Подключаемся к Socket.IO
    console.log('🔌 useChat: Creating socket...'); // ← ДОБАВИТЬ
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ useChat: Socket connected:', socket.id); // ← ИЗМЕНИТЬ
      
      // Отправляем токен для аутентификации
      const token = localStorage.getItem('token');
      console.log('🔐 useChat: Authenticating...'); // ← ДОБАВИТЬ
      socket.emit('authenticate', token);
      
      // Подключаемся к комнате заказа
      console.log('🔗 useChat: Joining order:', orderId); // ← ДОБАВИТЬ
      socket.emit('join-order', orderId);
    });

    socket.on('disconnect', (reason) => { // ← ДОБАВИТЬ reason
      console.log('❌ useChat: Disconnected. Reason:', reason); // ← ИЗМЕНИТЬ
    });

    socket.on('connect_error', (error) => { // ← ДОБАВИТЬ
      console.error('❌ useChat: Connection error:', error);
      setError('Connection failed');
      setLoading(false);
    });

    // Получение истории сообщений
    socket.on('message-history', (history: any[]) => {
      console.log('📜 useChat: Message history received:', history.length); // ← ИЗМЕНИТЬ
      setMessages(history);
      setLoading(false);
    });

    // Новое сообщение
// Новое сообщение
socket.on('new-message', (message: any) => {
  console.log('💬 useChat: New message received:', message);
  setMessages(prev => {
    const exists = prev.find(m => m.id === message.id);
    if (exists) {
      console.log('⚠️ useChat: Duplicate message, skipping');
      return prev;
    }
    
    // ✅ ДОБАВЛЕНО: Воспроизводим звук если сообщение НЕ от текущего пользователя
    if (message.fromUserId !== currentUserId) {
      (window as any).playNotificationSound?.();
      console.log('🔔 Notification sound played');
    }
    
    return [...prev, message];
  });
});

    // Ошибка подключения к комнате
    socket.on('join-error', (err: any) => {
      console.error('❌ useChat: Join error:', err); // ← ИЗМЕНИТЬ
      setError(err.error);
      setLoading(false);
    });

    // Ошибка отправки сообщения
    socket.on('message-error', (err: any) => {
      console.error('❌ useChat: Message error:', err); // ← ИЗМЕНИТЬ
      setError(err.error);
    });

    // Cleanup
    return () => {
      console.log('🧹 useChat: Cleaning up...'); // ← ДОБАВИТЬ
      if (socketRef.current) {
        socketRef.current.emit('leave-order', orderId);
        socketRef.current.disconnect();
      }
    };
  }, [orderId]);

  const sendMessage = (text: string, fileUrl?: string, fileType?: string) => {
    if (!socketRef.current) {
      console.error('❌ sendMessage: No socket!'); // ← ДОБАВИТЬ
      return;
    }
    
    if (!text.trim() && !fileUrl) {
      console.error('❌ sendMessage: Empty message!'); // ← ДОБАВИТЬ
      return;
    }

    const messageData = {
      orderId,
      message: text || '',
      senderId: currentUserId,
      fileUrl,
      fileType,
    };

    console.log('📤 useChat: Sending message:', messageData); // ← ИЗМЕНИТЬ
    socketRef.current.emit('send-message', messageData);
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
  };
}