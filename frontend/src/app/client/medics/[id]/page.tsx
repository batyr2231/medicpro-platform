"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Star, Award, Briefcase, Users, Phone, Loader, GraduationCap, MessageCircle } from 'lucide-react';

export default function MedicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const medicId = params.id as string;

  const [medic, setMedic] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedicProfile();
  }, [medicId]);

  const loadMedicProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      // ✅ ПРОВЕРКА: Запрещаем медикам смотреть профили
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'MEDIC') {
          console.log('❌ Medics cannot view other medic profiles');
          router.push('/medic/dashboard');
          return;
        }
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/medics/${medicId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      setMedic(data);
    } catch (err) {
      console.error('Failed to load medic:', err);
    } finally {
      setLoading(false);
    }
  };
  

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <Loader className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!medic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center text-white px-4">
        <div className="text-center">
          <p className="text-lg md:text-xl mb-4">Медик не найден</p>
          <button
            onClick={() => router.push('/client/medics')}
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400"
          >
            Вернуться к каталогу
          </button>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 md:w-5 md:h-5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <button
            onClick={() => router.push('/client/medics')}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm md:text-base">К каталогу</span>
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4 md:py-8">
        {/* Профиль */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-4 md:p-8 mb-4 md:mb-6">
          {/* Мобильная версия - вертикальный layout */}
          <div className="md:hidden">
            <div className="flex flex-col items-center text-center mb-4">
              {medic.avatar ? (
                <img
                  src={medic.avatar}
                  alt={medic.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-cyan-500/30 shadow-xl mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-3xl font-bold shadow-xl mb-3">
                  {medic.name[0]}
                </div>
              )}
              <h1 className="text-xl font-bold mb-1">{medic.name}</h1>
              <p className="text-cyan-400 text-sm mb-2">{medic.specialization}</p>
              <div className="flex items-center space-x-1 text-xs text-slate-400 mb-3">
                <MapPin className="w-3 h-3" />
                <span>{medic.city}, {medic.district}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-400">{medic.avgRating}</span>
                <span className="text-xs text-slate-400">({medic.reviewCount})</span>
              </div>
            </div>
          </div>

          {/* Десктопная версия - горизонтальный layout */}
          <div className="hidden md:flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              {medic.avatar ? (
                <img
                  src={medic.avatar}
                  alt={medic.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-cyan-500/30 shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-4xl font-bold shadow-xl">
                  {medic.name[0]}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold mb-2">{medic.name}</h1>
                <p className="text-cyan-400 text-lg mb-2">{medic.specialization}</p>
                <div className="flex items-center space-x-2 text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span>{medic.city}, {medic.district}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                <span className="text-3xl font-bold text-yellow-400">{medic.avgRating}</span>
              </div>
              <p className="text-slate-400 text-sm">{medic.reviewCount} отзывов</p>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
            <div className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex flex-col md:flex-row items-center md:space-x-2 mb-1 md:mb-2">
                <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-cyan-400 mb-1 md:mb-0" />
                <span className="text-xs md:text-sm text-slate-400">Опыт</span>
              </div>
              <div className="text-lg md:text-2xl font-bold text-center md:text-left">
                {medic.experience} {medic.experience === 1 ? 'год' : medic.experience < 5 ? 'года' : 'лет'}
              </div>
            </div>

            <div className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex flex-col md:flex-row items-center md:space-x-2 mb-1 md:mb-2">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-green-400 mb-1 md:mb-0" />
                <span className="text-xs md:text-sm text-slate-400">Заказов</span>
              </div>
              <div className="text-lg md:text-2xl font-bold text-center md:text-left">{medic.completedOrders}</div>
            </div>

            <div className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex flex-col md:flex-row items-center md:space-x-2 mb-1 md:mb-2">
                <Award className="w-4 h-4 md:w-5 md:h-5 text-purple-400 mb-1 md:mb-0" />
                <span className="text-xs md:text-sm text-slate-400">Отзывов</span>
              </div>
              <div className="text-lg md:text-2xl font-bold text-center md:text-left">{medic.reviewCount}</div>
            </div>
          </div>

          {/* О себе */}
          {medic.bio && (
            <div className="mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-semibold mb-2">О себе</h3>
              <p className="text-sm md:text-base text-slate-300">{medic.bio}</p>
            </div>
          )}

          {/* Образование */}
          {medic.education && (
            <div className="mb-4 md:mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <GraduationCap className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
                <h3 className="text-base md:text-lg font-semibold">Образование</h3>
              </div>
              <p className="text-sm md:text-base text-slate-300">{medic.education}</p>
            </div>
          )}

          {/* Услуги */}
          {medic.services && medic.services.length > 0 && (
            <div className="mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-semibold mb-3">Услуги</h3>
              <div className="flex flex-wrap gap-2">
                {medic.services.map((service: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs md:text-sm"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Кнопки связи */}
          <button
            onClick={() => {
              // Создаем временный заказ для чата или используем существующий
              router.push(`/client/medics/${medicId}/chat`);
            }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center text-lg"
          >
            <MessageCircle className="w-6 h-6 mr-2" />
            Написать в чат
          </button>
        </div>

        {/* Распределение рейтингов */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Распределение рейтингов</h2>
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="flex items-center space-x-1 w-12 md:w-20">
                <span className="text-xs md:text-sm">{star}</span>
                <Star className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 h-1.5 md:h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                  style={{
                    width: `${medic.reviewCount > 0 ? (medic.ratingDistribution[star] / medic.reviewCount) * 100 : 0}%`
                  }}
                />
              </div>
              <span className="text-xs md:text-sm text-slate-400 w-8 md:w-12 text-right">
                {medic.ratingDistribution[star]}
              </span>
            </div>
          ))}
        </div>

        {/* Отзывы */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">
            Отзывы ({medic.reviewCount})
          </h2>

          {medic.reviews.length === 0 ? (
           <p className="text-slate-400 text-center py-8 text-sm md:text-base">Пока нет отзывов</p>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {medic.reviews.map((review: any) => (
                <div
                  key={review.id}
                  className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-3">
                    <div className="mb-2 md:mb-0">
                      <div className="font-semibold text-sm md:text-base mb-1">{review.clientName}</div>
                      <div className="text-xs md:text-sm text-slate-400">{review.serviceType}</div>
                    </div>
                    <div className="flex items-center justify-between md:text-right">
                      <div className="flex items-center space-x-1">
                        {renderStars(review.rating)}
                      </div>
                      <div className="text-xs text-slate-400 md:hidden ml-2">
                        {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <div className="hidden md:block text-xs text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm md:text-base text-slate-300">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}