"use client";

import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Award, Save, Loader, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PhoneInput from '@/components/PhoneInput'; 

export default function MedicProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [showTelegramInput, setShowTelegramInput] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    specialization: '',
    experience: '',
    education: '',
    areas: [] as string[],
  });

  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

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
      if (result.telegramChatId) {
        setTelegramConnected(true);
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

  const handleConnectTelegram = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/medics/connect-telegram`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chatId: telegramChatId })
      }
    );

    const result = await response.json();

    if (response.ok) {
      setTelegramConnected(true);
      setShowTelegramInput(false);
      toast.success('✅ Telegram успешно подключён!');
    } else {
      toast.error('❌ Ошибка: ' + result.error);
    }
  } catch (error) {
    console.error('Connect Telegram error:', error);
    toast.error('❌ Ошибка подключения');
  }
};

const handleDisconnectTelegram = async () => {
  if (!confirm('Отключить Telegram уведомления?')) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/medics/disconnect-telegram`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (response.ok) {
      setTelegramConnected(false);
      toast.success('✅ Telegram отключён');
    }
  } catch (error) {
    console.error('Disconnect Telegram error:', error);
    toast.error('❌ Ошибка');
  }
};

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>, type: 'LICENSE' | 'CERTIFICATE') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Только JPG, PNG или WEBP файлы');
      return;
    }

    // Проверка размера (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл должен быть меньше 10MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', type);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/medics/upload-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success('✅ Фото документа загружено!');
      setTimeout(() => window.location.reload(), 1500);

    } catch (err: any) {
      toast.error(err.message || 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
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
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => handleChange('phone', value)}
                  placeholder="+7 (___) ___-__-__"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors"
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

  {/* Telegram уведомления */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="text-2xl mr-2">📱</span>
              Telegram уведомления
            </h2>

            {telegramConnected ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">Telegram подключён</span>
                </div>

                <p className="text-sm text-slate-400">
                  Вы будете получать уведомления о новых заказах в Telegram
                </p>

                <button
                  type="button"
                  onClick={handleDisconnectTelegram}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Отключить Telegram
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {!showTelegramInput ? (
                  <div>
                    <p className="text-slate-300 mb-4">
                      Подключите Telegram чтобы получать мгновенные уведомления о новых заказах
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowTelegramInput(true)}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 font-semibold shadow-lg transition-all"
                    >
                      📱 Подключить Telegram
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm text-slate-300 mb-2">
                        <strong>Инструкция:</strong>
                      </p>
                      <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                        <li>Откройте Telegram</li>
                        <li>Найдите бота (создайте через @BotFather)</li>
                        <li>Нажмите <strong>/start</strong></li>
                        <li>Скопируйте Chat ID который бот отправит</li>
                        <li>Вставьте код ниже</li>
                      </ol>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Chat ID из бота:
                      </label>
                      <input
                        type="text"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        placeholder="Например: 123456789"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={handleConnectTelegram}
                        disabled={!telegramChatId}
                        className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg transition-all"
                      >
                        Подключить
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowTelegramInput(false)}
                        className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Загрузка документов */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Award className="w-6 h-6 mr-2 text-cyan-400" />
              📄 Документы (фото)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  🏥 Медицинская лицензия
                </label>
                <label className="flex-1 cursor-pointer block">
                  <div className="flex items-center justify-center gap-2 px-4 py-4 bg-blue-600/20 border-2 border-dashed border-blue-500/50 rounded-xl hover:bg-blue-600/30 hover:border-blue-500/70 transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Загрузить фото лицензии</span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => handleUploadDocument(e, 'LICENSE')}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-slate-400 mt-2">JPG, PNG, WEBP • Макс 10MB</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  🎓 Сертификаты и дипломы
                </label>
                <label className="flex-1 cursor-pointer block">
                  <div className="flex items-center justify-center gap-2 px-4 py-4 bg-blue-600/20 border-2 border-dashed border-blue-500/50 rounded-xl hover:bg-blue-600/30 hover:border-blue-500/70 transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Загрузить фото сертификата</span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => handleUploadDocument(e, 'CERTIFICATE')}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-slate-400 mt-2">JPG, PNG, WEBP • Макс 10MB</p>
              </div>
            </div>

            {uploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-blue-400 bg-blue-500/10 rounded-xl p-4">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Загрузка фото...</span>
              </div>
            )}

            <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-sm text-yellow-300">
                ⚠️ После загрузки фото документов ваш профиль будет отправлен на повторную модерацию
              </p>
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