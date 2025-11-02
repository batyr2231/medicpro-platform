"use client";

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useUnreadMessages() {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [socketRef, setSocketRef] = useState<Socket | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);
    const token = localStorage.getItem('token');

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('authenticate', token);
    });

    // Слушаем новые сообщения
    socket.on('new-chat-message', (data: any) => {
      const { orderId } = data;
      
      // Увеличиваем счётчик непрочитанных
      setUnreadCounts(prev => ({
        ...prev,
        [orderId]: (prev[orderId] || 0) + 1
      }));
    });

    setSocketRef(socket);

    return () => {
      socket.disconnect();
    };
  }, []);

  const markAsRead = (orderId: string) => {
    setUnreadCounts(prev => ({
      ...prev,
      [orderId]: 0
    }));
  };

  return { unreadCounts, markAsRead };
}