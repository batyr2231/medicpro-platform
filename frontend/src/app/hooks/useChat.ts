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
    // Проверка orderId
    if (!orderId) {
      setError('Order ID is required');
      setLoading(false);
      return;
    }

    // Получаем текущего пользователя
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setError('User not found');
      setLoading(false);
      return;
    }

    const user = JSON.parse(userStr);
    setCurrentUserId(user.id);

    // Подключаемся к Socket.IO
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Connected to socket');
      
      // Отправляем токен для аутентификации
      const token = localStorage.getItem('token');
      socket.emit('authenticate', token);
      
      // Подключаемся к комнате заказа
      socket.emit('join-order', orderId);
      console.log('🔗 Joined order room:', orderId);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from socket');
    });

    // Получение истории сообщений
    socket.on('message-history', (history: any[]) => {
      console.log('📜 Message history received:', history.length);
      setMessages(history);
      setLoading(false);
    });

    // Новое сообщение
    socket.on('new-message', (message: any) => {
      console.log('💬 New message received:', message);
      setMessages(prev => {
        // Проверяем что сообщение не дублируется
        const exists = prev.find(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    // Ошибка подключения к комнате
    socket.on('join-error', (err: any) => {
      console.error('❌ Join error:', err);
      setError(err.error);
      setLoading(false);
    });

    // Ошибка отправки сообщения
    socket.on('message-error', (err: any) => {
      console.error('❌ Message error:', err);
      setError(err.error);
    });

    // Cleanup
    return () => {
      socket.emit('leave-order', orderId);
      socket.disconnect();
    };
  }, [orderId]);

  const sendMessage = (text: string, fileUrl?: string, fileType?: string) => {
    if (!socketRef.current || (!text.trim() && !fileUrl)) return;

    const messageData = {
      orderId,
      message: text || '',
      senderId: currentUserId,
      fileUrl,
      fileType,
    };

    console.log('📤 Sending message:', messageData);
    socketRef.current.emit('send-message', messageData);
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
  };
}