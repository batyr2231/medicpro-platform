"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Star, Award, Briefcase, Users, Phone, MessageSquare, Loader, GraduationCap } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Медик не найден</p>
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
        className={`w-5 h-5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/client/medics')}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>К каталогу</span>
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Профиль */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-4xl font-bold shadow-xl">
                {medic.name[0]}
              </div>
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
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Briefcase className="w-5 h-5 text-cyan-400" />
                <span className="text-slate-400">Опыт</span>
              </div>
              <div className="text-2xl font-bold">{medic.experience} лет</div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-slate-400">Заказов</span>
              </div>
              <div className="text-2xl font-bold">{medic.completedOrders}</div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-5 h-5 text-purple-400" />
                <span className="text-slate-400">Отзывов</span>
              </div>
              <div className="text-2xl font-bold">{medic.reviewCount}</div>
            </div>
          </div>

          {/* О себе */}
          {medic.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">О себе</h3>
              <p className="text-slate-300">{medic.bio}</p>
            </div>
          )}

          {/* Образование */}
          {medic.education && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold">Образование</h3>
              </div>
              <p className="text-slate-300">{medic.education}</p>
            </div>
          )}

          {/* Услуги */}
          {medic.services && medic.services.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Услуги</h3>
              <div className="flex flex-wrap gap-2">
                {medic.services.map((service: string, index: number) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Кнопки связи */}
          <div className="flex gap-3">
            <a 
              href={`tel:${medic.phone}`}
              className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-all"
            >
              <Phone className="w-5 h-5" />
              <span>Позвонить</span>
            </a>

            <a
              href={`https://wa.me/${medic.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Распределение рейтингов */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Распределение рейтингов</h2>
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-3 mb-2">
              <div className="flex items-center space-x-1 w-20">
                <span className="text-sm">{star}</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                  style={{
                    width: `${medic.reviewCount > 0 ? (medic.ratingDistribution[star] / medic.reviewCount) * 100 : 0}%`
                  }}
                />
              </div>
              <span className="text-sm text-slate-400 w-12 text-right">
                {medic.ratingDistribution[star]}
              </span>
            </div>
          ))}
        </div>

        {/* Отзывы */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
          <h2 className="text-xl font-bold mb-4">Отзывы ({medic.reviewCount})</h2>

          {medic.reviews.length === 0 ? (
           <p className="text-slate-400 text-center py-8">Пока нет отзывов</p>
          ) : (
            <div className="space-y-4">
              {medic.reviews.map((review: any) => (
                <div
                  key={review.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold mb-1">{review.clientName}</div>
                      <div className="text-sm text-slate-400">{review.serviceType}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 mb-1">
                        {renderStars(review.rating)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-slate-300">{review.comment}</p>
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