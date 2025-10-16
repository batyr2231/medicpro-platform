"use client";

import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Award, Save, Loader, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function MedicProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    specialization: '',
    experience: '',
    education: '',
    areas: [] as string[],
  });

  const districts = [
    'Алмалинский', 'Ауэзовский', 'Бостандыкский', 'Жетысуский',
    'Медеуский', 'Наурызбайский', 'Турксибский', 'Алатауский'
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/medics/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setFormData({
          name: result.name || '',
          phone: result.phone || '',
          specialization: result.specialization || '',
          experience: result.experience || '',
          education: result.education || '',
          areas: result.areas || [],
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      toast.error('Не удалось загрузить профиль');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/medics/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      toast.success('✅ Профиль успешно обновлён!');
      
      // Обновляем данные пользователя в localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.name = formData.name;
      user.phone = formData.phone;
      localStorage.setItem('user', JSON.stringify(user));
      
    } catch (err: any) {
      console.error('Update profile error:', err);
      toast.error('Ошибка обновления профиля: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleDistrict = (district: string) => {
    const newAreas = formData.areas.includes(district)
      ? formData.areas.filter(d => d !== district)
      : [...formData.areas, district];
    
    setFormData({ ...formData, areas: newAreas });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push('/medic/dashboard')}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад</span>
            </button>
            <h1 className="text-xl font-bold">Мой профиль</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <User className="w-6 h-6 mr-2 text-cyan-400" />
              Личная информация
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ФИО
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Award className="w-6 h-6 mr-2 text-cyan-400" />
              Профессиональная информация
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Специализация
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                  placeholder="Например: Терапевт, Медсестра"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Опыт работы (лет)
                </label>
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) => handleChange('experience', e.target.value)}
                  placeholder="Например: 5"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Образование
                </label>
                <textarea
                  value={formData.education}
                  onChange={(e) => handleChange('education', e.target.value)}
                  placeholder="Например: Казахский Национальный Медицинский Университет, 2015"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Service Areas */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-2 text-cyan-400" />
              Районы обслуживания
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {districts.map((district) => (
                <button
                  key={district}
                  type="button"
                  onClick={() => toggleDistrict(district)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    formData.areas.includes(district)
                      ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500 shadow-lg shadow-cyan-500/20'
                      : 'bg-white/5 border-2 border-white/10 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="font-medium">{district}</div>
                  {formData.areas.includes(district) && (
                    <div className="text-xs text-cyan-400 mt-1">✓ Выбран</div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <div className="text-sm text-cyan-400">
                💡 Выбрано районов: {formData.areas.length}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center text-lg"
          >
            {loading ? (
              <>
                <Loader className="w-6 h-6 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-6 h-6 mr-2" />
                Сохранить изменения
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}