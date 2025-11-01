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
      
      // Отправляем токен для аутентификации (безопаснее!)
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
      setMessages(prev => [...prev, message]);
    });

    // Ошибка
    socket.on('message-error', (err: any) => {
      console.error('❌ Message error:', err);
      setError(err.error);
    });

    // Загружаем историю сообщений через REST API (на всякий случай)
    loadMessageHistory();

    return () => {
      socket.emit('leave-order', orderId);
      socket.disconnect();
    };
  }, [orderId]);

  const loadMessageHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/messages/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      setMessages(data);
      setLoading(false);
    } catch (err: any) {
      console.error('Load messages error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

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