"use client";

import { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'https://medicpro-platform.onrender.com';

interface Message {
  id: string;
  orderId: string;
  fromUserId: string;
  text?: string;
  fileUrl?: string;
  fileType?: string;
  isRead: boolean;
  createdAt: string;
  from: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export function useChat(orderId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const getToken = () => localStorage.getItem('token');

  // Загружаем историю сообщений
  useEffect(() => {
    loadMessages();
    connectSocket();

    return () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket...');
        socketRef.current.disconnect();
      }
    };
  }, [orderId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${orderId}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (response.ok) {
        console.log('✅ Messages loaded:', result.length);
        setMessages(result);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = () => {
    const token = getToken();
    if (!token) return;

    console.log('🔌 Connecting to socket...');
    
    const socket = io(WS_URL, {
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      socket.emit('authenticate', token);
    });

    socket.on('authenticated', () => {
      console.log('✅ Socket authenticated');
      socket.emit('join-order', orderId);
      console.log('✅ Joined order room:', orderId);
    });

    socket.on('new-message', (message: Message) => {
      console.log('📨 New message received:', message);
      setMessages((prev) => {
        // Проверяем что сообщение ещё не добавлено
        const exists = prev.some(m => m.id === message.id);
        if (exists) {
          console.log('⚠️ Message already exists, skipping');
          return prev;
        }
        console.log('✅ Adding new message to state');
        return [...prev, message];
      });
    });

    socket.on('message-error', (data: any) => {
      console.error('❌ Message error:', data);
      alert('Ошибка отправки: ' + data.error);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
    });

    socketRef.current = socket;
  };

  const sendMessage = (text: string, fileUrl?: string, fileType?: string) => {
    if (!socketRef.current || (!text?.trim() && !fileUrl)) {
      console.warn('⚠️ Cannot send message: no socket or empty message');
      return;
    }

    console.log('📤 Sending message:', { text, fileUrl, fileType });

    socketRef.current.emit('send-message', {
      orderId,
      text: text || '',
      fileUrl,
      fileType,
    });
  };

  return { messages, loading, error, sendMessage };
}