"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, AlertTriangle, Send, Loader } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useOrders } from '../../../../hooks/useOrders';
import toast from 'react-hot-toast';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isComplaint, setIsComplaint] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { getOrderById, loading } = useOrders();

  useEffect(() => {
    loadOrder();
  }, [orderId]);

const loadOrder = async () => {
  try {
    const result = await getOrderById(orderId);
    setOrder(result);
    
    if (result.status !== 'PAID' && result.status !== 'COMPLETED') {
      toast.error('Заказ ещё не завершён');
      router.push(`/client/orders/${orderId}`);
    }
  } catch (err) {
    console.error('Failed to load order:', err);
    toast.error('Не удалось загрузить заказ');
  }
};

const handleLogout = () => {
  if (confirm('Вы уверены что хотите выйти?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth');
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Пожалуйста, поставьте оценку', {
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      });
      return;
    }

    if (isComplaint) {
      if (!complaintCategory) {
        toast.error('Выберите категорию жалобы', {
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          },
        });
        return;
      }
      if (!complaintDescription || complaintDescription.trim().length < 10) {
        toast.error('Опишите жалобу подробнее (минимум 10 символов)', {
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          },
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: params.id,
            rating,
            comment,
            isComplaint,
            complaintCategory: isComplaint ? complaintCategory : null,
            complaintDescription: isComplaint ? complaintDescription : null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit review');
      }

      // ← КРАСИВЫЙ TOAST!
      if (isComplaint) {
        toast.custom(
          (t) => (
            <div
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-red-500/30 rounded-xl p-4 shadow-2xl max-w-md"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  ⚠️
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">
                    Жалоба отправлена
                  </div>
                  <div className="text-sm text-slate-300">
                    Администрация рассмотрит её в течение 24 часов
                  </div>
                </div>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          ),
          {
            duration: 4000,
            position: 'top-right',
          }
        );
      } else {
        toast.custom(
          (t) => (
            <div
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-green-500/30 rounded-xl p-4 shadow-2xl max-w-md"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  ⭐
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">
                    Спасибо за отзыв!
                  </div>
                  <div className="text-sm text-slate-300">
                    Ваше мнение поможет другим пользователям
                  </div>
                </div>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          ),
          {
            duration: 4000,
            position: 'top-right',
          }
        );
      }

      setTimeout(() => {
        router.push(`/client/orders/${params.id}`);
      }, 1500);

    } catch (err: any) {
      console.error('Submit review error:', err);
      toast.error('❌ ' + err.message, {
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <div className="text-white">Загрузка...</div>
        </div>
      </div>
    );
  }

  const complaintCategories = [
    'Опоздание',
    'Непрофессиональное поведение',
    'Некачественная услуга',
    'Завышенная цена',
    'Другое'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button 
            onClick={() => router.push(`/client/orders/${orderId}`)}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к заказу</span>
          </button>

          <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
        >
          <span className="text-sm">Выйти</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
      </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⭐</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Оцените работу медика</h1>
          <p className="text-slate-400">Ваше мнение поможет улучшить сервис</p>
        </div>

        {/* Order Info */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl font-bold">
              {order.medic?.name[0]}
            </div>
            <div>
              <div className="font-semibold text-lg">{order.medic?.name}</div>
              <div className="text-slate-400">{order.serviceType}</div>
              <div className="text-sm text-slate-500">
                {new Date(order.completedAt || order.createdAt).toLocaleDateString('ru-RU')}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8">
            <h2 className="text-xl font-bold mb-6 text-center">Поставьте оценку</h2>
            
            <div className="flex items-center justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-12 h-12 sm:w-16 sm:h-16 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-transparent text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="text-center text-slate-400">
              {rating === 0 && 'Выберите оценку'}
              {rating === 1 && '😞 Очень плохо'}
              {rating === 2 && '😕 Плохо'}
              {rating === 3 && '😐 Нормально'}
              {rating === 4 && '😊 Хорошо'}
              {rating === 5 && '🤩 Отлично'}
            </div>
          </div>

          {/* Comment */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">Комментарий (необязательно)</h2>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Расскажите о вашем опыте. Что понравилось или что можно улучшить?"
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors resize-none"
            />
          </div>

          {/* Complaint Toggle */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
            <button
              type="button"
              onClick={() => setIsComplaint(!isComplaint)}
              className="flex items-center space-x-3 w-full"
            >
              <div className={`w-12 h-6 rounded-full transition-colors ${
                isComplaint ? 'bg-red-500' : 'bg-slate-600'
              } relative`}>
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  isComplaint ? 'translate-x-6' : 'translate-x-0.5'
                }`}></div>
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                  Подать жалобу
                </div>
                <div className="text-sm text-slate-400">
                  Если возникли серьёзные проблемы
                </div>
              </div>
            </button>

            {/* Complaint Form */}
            {isComplaint && (
              <div className="mt-6 space-y-4 animate-slide-in">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Категория жалобы
                  </label>
                  <select
                    value={complaintCategory}
                    onChange={(e) => setComplaintCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-red-500 focus:outline-none text-white transition-colors"
                    required={isComplaint}
                  >
                    <option value="" className="bg-slate-900">Выберите категорию</option>
                    {complaintCategories.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-900">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Подробное описание
                  </label>
                  <textarea
                    value={complaintDescription}
                    onChange={(e) => setComplaintDescription(e.target.value)}
                    placeholder="Опишите проблему подробно. Эта информация будет передана администрации."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-red-500 focus:outline-none text-white placeholder-slate-500 transition-colors resize-none"
                    required={isComplaint}
                  />
                </div>

                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="text-sm text-red-400">
                    ⚠️ Жалоба будет рассмотрена администрацией в течение 24 часов
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg transition-all flex items-center justify-center text-lg"
          >
            {submitting ? (
              <>
                <Loader className="w-6 h-6 mr-2 animate-spin" />
                Отправка...
              </>
            ) : (
              <>
                <Send className="w-6 h-6 mr-2" />
                Отправить отзыв
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}