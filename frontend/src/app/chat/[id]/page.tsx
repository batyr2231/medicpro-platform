"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Paperclip, Check, CheckCheck, Smile, Image as ImageIcon, FileText, Loader, X} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useChat } from '../../hooks/useChat';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

//import toast from 'react-hot-toast';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { markAsRead } = useUnreadMessages();
  const [messageText, setMessageText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const { messages, loading, error, sendMessage } = useChat(orderId);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUserId(userData.id);
    }
    
    loadOrderInfo();
  }, [orderId]);

  useEffect(() => {
    // Сбрасываем счётчик при открытии чата
    markAsRead(orderId);
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadOrderInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (response.ok) {
        setOrderInfo(result);
      }
    } catch (err) {
      console.error('Failed to load order info:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    sendMessage(messageText);
    setMessageText('');
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Проверка размера (10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert('Файл слишком большой! Максимум 10MB');
    return;
  }

  setSelectedFile(file);
  e.target.value = ''; // Сбросить input
};

  const handleSendFile = async () => {
  if (!selectedFile) return;

  setUploading(true);
  try {
    const formData = new FormData();
    formData.append('file', selectedFile);

    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to upload');
    }

    // Отправляем сообщение с файлом
    sendMessage('', result.url, result.type);
    
    setSelectedFile(null);
    
  } catch (err: any) {
    console.error('File upload error:', err);
    alert('❌ Ошибка загрузки: ' + err.message);
  } finally {
    setUploading(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <div className="text-white">Загрузка чата...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                  router.push('/auth');
                  return;
                }
                
                try {
                  const user = JSON.parse(userStr);
                  console.log('👤 Current user role:', user.role); // Для отладки
                  
                  if (user.role === 'MEDIC') {
                    router.push('/medic/dashboard');
                  } else if (user.role === 'CLIENT') {
                    router.push('/client/orders');
                  } else if (user.role === 'ADMIN') {
                    router.push('/admin');
                  } else {
                    router.back();
                  }
                } catch (err) {
                  console.error('Error parsing user:', err);
                  router.push('/auth');
                }
              }}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center flex-1">
              <div className="font-semibold">Чат с {orderInfo?.medic?.name || orderInfo?.client?.name || 'пользователем'}</div>
              <div className="text-xs text-slate-400">Заказ #{orderId.slice(0, 8)}</div>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {/* Date Divider */}
          <div className="flex items-center justify-center my-6">
            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">
              Сегодня
            </div>
          </div>

          {/* Messages */}
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-slate-400 text-sm">Нет сообщений. Начните общение!</div>
            </div>
          ) : (
            messages.map((msg) => {
              const fromMe = msg.fromUserId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${fromMe ? 'justify-end' : 'justify-start'} animate-slide-in`}
                >
                  <div className={`flex items-end space-x-2 max-w-md lg:max-w-lg ${fromMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!fromMe && msg.from && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-lg flex-shrink-0">
                        {msg.from.name[0]}
                      </div>
                    )}
                    
                    <div>
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          fromMe
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-br-sm'
                            : 'bg-white/10 backdrop-blur-sm border border-white/10 text-white rounded-bl-sm'
                        }`}
                      >
                        {/* Если есть файл - показываем его */}
                        {msg.fileUrl && (
                          <div className="mb-2">
                            {msg.fileType?.startsWith('image/') ? (
                              <img 
                                src={msg.fileUrl} 
                                alt="Attachment" 
                                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(msg.fileUrl, '_blank')}
                                style={{ maxWidth: '300px' }}
                              />
                            ) : (
                              <a 
                                href={msg.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M8 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0017.414 6L12 .586A2 2 0 0010.586 0H8z" />
                                </svg>
                                <span className="text-sm">Открыть файл</span>
                              </a>
                            )}
                          </div>
                        )}
                        
                        {/* Текст сообщения - только если есть */}
                        {msg.text && msg.text.trim() && (
                          <div className="text-sm leading-relaxed">{msg.text}</div>
                        )}
                        
                        {/* Если нет ни текста ни файла - показываем заглушку */}
                        {!msg.text && !msg.fileUrl && (
                          <div className="text-sm text-slate-400 italic">Пустое сообщение</div>
                        )}
                      </div>
                      
                      <div className={`flex items-center space-x-1 mt-1 px-1 text-xs text-slate-400 ${fromMe ? 'justify-end' : ''}`}>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {fromMe && (
                          msg.isRead ? (
                            <CheckCheck className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 backdrop-blur-xl bg-slate-900/50 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Превью выбранного файла */}
          {selectedFile && (
            <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {selectedFile.type.startsWith('image/') ? (
                    <img 
                      src={URL.createObjectURL(selectedFile)} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-red-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-white">{selectedFile.name}</div>
                    <div className="text-sm text-slate-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                >
                  <X className="w-5 h-5 text-red-400" />
                </button>
              </div>
              
              <button
                onClick={handleSendFile}
                disabled={uploading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 font-medium transition-all flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  '📤 Отправить файл'
                )}
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="hidden"
            />

            {/* Attach Button */}
            <button
              type="button"
              onClick={handleFileClick}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex-shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Message Input */}
            <div className="flex-1 relative">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Напишите сообщение..."
                rows={1}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors resize-none"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-lg shadow-blue-500/30"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}