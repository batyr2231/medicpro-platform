"use client";

import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Award, Save, Loader, ArrowLeft } from 'lucide-react';
// import { useRouter } from 'next/navigation'; // - Mocked below
// import toast from 'react-hot-toast'; // - Mocked below
// import PhoneInput from '@/components/PhoneInput';  // - Mocked below
// import { getCities, getDistricts } from 'utils/cities'; // - Inlined below

// =================================================================================
// --- MOCK ДЛЯ ПРЕДПРОСМОТРА ---
// ВАЖНО: Этот блок кода нужен ТОЛЬКО для того, чтобы
// предпросмотр справа мог скомпилироваться.
// Он имитирует ваши настоящие импорты.
//
// При переносе в ваш проект, УДАЛИТЕ этот блок и раскомментируйте
// настоящие импорты вверху файла.
// =================================================================================

// --- MOCK: next/navigation ---
const useRouter = () => ({
  push: (path: string) => console.log(`[Router] Navigating to: ${path}`),
  back: () => console.log('[Router] Navigating back'),
});

// --- MOCK: react-hot-toast ---
const toast = {
  success: (message: string) => console.log(`[Toast Success] ${message}`),
  error: (message: string) => console.log(`[Toast Error] ${message}`),
};

// --- INLINE: utils/cities.ts ---
const CITIES: Record<string, string[]> = {
  'Алматы': [
    'Алмалинский', 'Ауэзовский', 'Бостандыкский', 'Жетысуский',
    'Медеуский', 'Наурызбайский', 'Турксибский', 'Алатауский'
  ],
  'Астана': [
    'Алматинский', 'Есильский', 'Сарыаркинский', 'Байконурский'
  ],
  'Шымкент': [
    'Абайский', 'Аль-Фарабийский', 'Енбекшинский', 'Каратауский'
  ],
};
const getCities = () => Object.keys(CITIES);
const getDistricts = (city: string) => CITIES[city] || [];

// --- MOCK: @/components/PhoneInput.tsx ---
const PhoneInput = ({ value, onChange, className, placeholder, required, disabled }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}) => {
  return (
    <input
      type="tel"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className={className}
      disabled={disabled}
    />
  );
};

// --- ИМИТАЦИЯ API_URL ---
// (Используем запасной URL, так как process.env недоступен в предпросмотре)
const API_URL = 'http://localhost:5000';

// =================================================================================
// --- КОНЕЦ MOCK ДЛЯ ПРЕДПРОСМОТРА ---
// =================================================================================


export default function MedicProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [showTelegramInput, setShowTelegramInput] = useState(false);
  const [telegramDeepLink, setTelegramDeepLink] = useState('');
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    specialization: '',
    experience: '',
    education: '',
    city: '',
    areas: [] as string[],
  });

  // --- Состояние для ошибок валидации ---
  const [errors, setErrors] = useState<any>({});

  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  
  // --- ИЗМЕНЕНИЕ ДЛЯ ТЕСТИРОВАНИЯ ---
  // Поставьте 'APPROVED' или 'PENDING', чтобы увидеть заблокированную загрузку
  // Поставьте 'REJECTED', чтобы увидеть активную форму загрузки
  const [medicStatus, setMedicStatus] = useState<string>('REJECTED'); 

  useEffect(() => {
    loadProfile();
  }, []);

  // --- ИМИТАЦИЯ ЗАГРУЗКИ ПРОФИЛЯ (для предпросмотра) ---
  const loadProfile = async () => {
    setLoading(true);
    console.log("[MOCK] Загрузка профиля...");
    setTimeout(() => {
      try {
        // Имитируем ответ от сервера
        const result = {
          name: 'Тестовый Медик',
          phone: '+7 (777) 123-45-67',
          specialization: 'Главный терапевт',
          experience: '10',
          education: 'КазНМУ им. Асфендиярова, 2010',
          city: 'Алматы',
          areas: ['Алмалинский', 'Бостандыкский'],
          status: medicStatus, // Используем статус из state для теста
          telegramChatId: null,
        };

        setFormData({
          name: result.name || '',
          phone: result.phone || '',
          specialization: result.specialization || '',
          experience: result.experience || '',
          education: result.education || '',
          city: result.city || 'Алматы',
          areas: result.areas || [],
        });
        
        setMedicStatus(result.status || 'PENDING'); 
        
        if (result.telegramChatId) {
          setTelegramConnected(true);
        }
        console.log("[MOCK] Профиль загружен:", result);
      } catch (err) {
        console.error('Failed to load profile:', err);
        toast.error('Не удалось загрузить профиль');
      } finally {
        setLoading(false);
      }
    }, 1000); // 1 секунда задержки
  };

  // --- Функция валидации ---
  const validateForm = () => {
    const newErrors: any = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = true;
      isValid = false;
    }
    // Простая проверка телефона (например, по длине)
    if (formData.phone.replace(/\D/g, '').length < 11) {
      newErrors.phone = true;
      isValid = false;
    }
    if (!formData.specialization.trim()) {
      newErrors.specialization = true;
      isValid = false;
    }
    if (!formData.experience.trim()) {
      newErrors.experience = true;
      isValid = false;
    }
    if (!formData.education.trim()) {
      newErrors.education = true;
      isValid = false;
    }
    if (!formData.city) {
      newErrors.city = true;
      isValid = false;
    }
    if (formData.city && formData.areas.length === 0) {
      newErrors.areas = true;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // --- ИМИТАЦИЯ СОХРАНЕНИЯ ПРОФИЛЯ (для предпросмотра) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Сначала ставим loading
    
    // --- Запуск валидации при сохранении ---
    if (!validateForm()) {
      toast.error('❌ Пожалуйста, заполните все обязательные поля');
      setLoading(false); // Сбрасываем loading, если валидация не прошла
      return;
    }

    // Если валидация прошла, продолжаем
    console.log("[MOCK] Сохранение профиля...");
    
    setTimeout(() => {
      try {
        // Имитируем успешный ответ
        console.log("[MOCK] Профиль сохранен:", formData);
        toast.success('✅ Профиль успешно обновлён!');
        
        if (typeof localStorage !== 'undefined') {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.name = formData.name;
          user.phone = formData.phone;
          localStorage.setItem('user', JSON.stringify(user));
        }
        
      } catch (err: any) {
        console.error('Update profile error:', err);
        toast.error('Ошибка обновления профиля: ' + err.message);
      } finally {
        setLoading(false);
      }
    }, 1500); // 1.5 секунды задержки
  };

  // --- Сброс ошибки при изменении поля ---
  const handleChange = (field: string, value: any) => {
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: false }));
    }
    setFormData({ ...formData, [field]: value });
  };

  // --- Сброс ошибки при выборе района ---
  const toggleDistrict = (district: string) => {
    const newAreas = formData.areas.includes(district)
      ? formData.areas.filter(d => d !== district)
      : [...formData.areas, district];
    
    if (errors.areas && newAreas.length > 0) {
      setErrors((prev: any) => ({ ...prev, areas: false }));
    }
    
    setFormData({ ...formData, areas: newAreas });
  };

  // --- ИМИТАЦИЯ ПОДКЛЮЧЕНИЯ TELEGRAM (для предпросмотра) ---
  const handleConnectTelegram = async () => {
    setLoading(true);
    console.log("[MOCK] Генерация ссылки Telegram...");
    setTimeout(() => {
      try {
        // Имитируем успешный ответ
        const result = { deepLink: 'https://t.me/your_bot_username?start=MOCK_CODE' };
        setTelegramDeepLink(result.deepLink);
        setShowTelegramInput(true);
        toast.success('✅ Ссылка готова! Откройте Telegram');
        startCheckingConnection();
      } catch (error) {
        console.error('Connect Telegram error:', error);
        toast.error('❌ Ошибка генерации ссылки');
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  const startCheckingConnection = () => {
    setCheckingConnection(true);
    
    const interval = setInterval(async () => {
      try {
        // --- ИМИТАЦИЯ: Вместо fetch, просто проверим состояние ---
        // (В реальном приложении здесь был бы fetch)
        if (Math.random() > 0.8) { // Имитируем 20% шанс подключения
          console.log("[MOCK] Telegram подключен!");
          setTelegramConnected(true);
          setShowTelegramInput(false);
          setCheckingConnection(false);
          clearInterval(interval);
          toast.success('🎉 Telegram успешно подключён!');
        } else {
          console.log("[MOCK] Проверка подключения Telegram...");
        }
      } catch (error) {
        console.error('Check connection error:', error);
      }
    }, 3000);
    
    setTimeout(() => {
      clearInterval(interval);
      setCheckingConnection(false);
      console.log("[MOCK] Проверка подключения остановлена по таймауту.");
    }, 120000); // 2 минуты
  };

  // --- ИМИТАЦИЯ ОТКЛЮЧЕНИЯ TELEGRAM (для предпросмотра) ---
  const handleDisconnectTelegram = async () => {
    if (typeof window !== 'undefined' && !window.confirm('Отключить Telegram уведомления?')) return;
    setLoading(true);
    console.log("[MOCK] Отключение Telegram...");
    setTimeout(() => {
      try {
        setTelegramConnected(false);
        toast.success('✅ Telegram отключён');
      } catch (error) {
        console.error('Disconnect Telegram error:', error);
        toast.error('❌ Ошибка');
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  // --- ИМИТАЦИЯ ЗАГРУЗКИ ДОКУМЕНТА (для предпросмотра) ---
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>, type: 'LICENSE' | 'CERTIFICATE') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Только JPG, PNG или WEBP файлы');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл должен быть меньше 10MB');
      return;
    }

    setUploading(true);
    console.log(`[MOCK] Загрузка документа: ${file.name}`);

    setTimeout(() => {
      try {
        // Имитируем успешную загрузку
        console.log(`[MOCK] Документ ${file.name} загружен.`);
        toast.success('✅ Фото документа загружено!');
        
        // Имитируем перезагрузку страницы (для обновления статуса)
        setTimeout(() => {
          setMedicStatus('PENDING'); // Устанавливаем статус "На модерации"
          console.log("[MOCK] Статус обновлен на PENDING");
        }, 1500);

      } catch (err: any) {
        toast.error(err.message || 'Ошибка загрузки');
      } finally {
        setUploading(false);
      }
    }, 2000); // 2 секунды задержки
  };

  // --- Переменная для блокировки загрузки ---
  const uploadsDisabled = medicStatus === 'APPROVED' || medicStatus === 'PENDING';

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

      {/* Бейдж верификации */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        {medicStatus === 'APPROVED' && (
          <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-green-400 text-lg">✅ Профиль верифицирован</div>
                <div className="text-sm text-slate-400">Ваши документы проверены администрацией</div>
              </div>
            </div>
          </div>
        )}

        {medicStatus === 'PENDING' && (
          <div className="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Loader className="w-7 h-7 text-yellow-400 animate-spin" />
              </div>
              <div>
                <div className="font-bold text-yellow-400 text-lg">⏳ На модерации</div>
                <div className="text-sm text-slate-400">Ваш профиль проверяется администрацией</div>
              </div>
            </div>
          </div>
        )}

        {medicStatus === 'REJECTED' && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-red-400 text-lg">❌ Профиль отклонён</div>
                <div className="text-sm text-slate-400">Свяжитесь с поддержкой или загрузите документы повторно</div>
              </div>
            </div>
          </div>
        )}
      </div>

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
                  ФИО <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.name ? 'border-red-500' : 'border-white/10'
                  } focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors`}
                  required
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">Поле "ФИО" обязательно</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Телефон <span className="text-red-400">*</span>
                </label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => handleChange('phone', value)}
                  placeholder="+7 (___) ___-__-__"
                  required
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.phone ? 'border-red-500' : 'border-white/10'
                  } focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors`}
                />
                {errors.phone && <p className="text-red-400 text-sm mt-1">Введите корректный номер телефона</p>}
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
                  Специализация <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                  placeholder="Например: Терапевт, Медсестра"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.specialization ? 'border-red-500' : 'border-white/10'
                  } focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors`}
                />
                {errors.specialization && <p className="text-red-400 text-sm mt-1">Поле "Специализация" обязательно</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Опыт работы (лет) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) => handleChange('experience', e.target.value)}
                  placeholder="Например: 5"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.experience ? 'border-red-500' : 'border-white/10'
                  } focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors`}
                />
                {errors.experience && <p className="text-red-400 text-sm mt-1">Поле "Опыт работы" обязательно</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Образование <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.education}
                  onChange={(e) => handleChange('education', e.target.value)}
                  placeholder="Например: Казахский Национальный Медицинский Университет, 2015"
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.education ? 'border-red-500' : 'border-white/10'
                  } focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors resize-none`}
                />
                {errors.education && <p className="text-red-400 text-sm mt-1">Поле "Образование" обязательно</p>}
              </div>
            </div>
          </div>

          {/* Выбор города */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 mb-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-2 text-cyan-400" />
              Город работы
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                В каком городе вы работаете? <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.city}
                onChange={(e) => {
                  if (errors.city || errors.areas) {
                    setErrors((prev: any) => ({ ...prev, city: false, areas: false }));
                  }
                  setFormData({ 
                    ...formData, 
                    city: e.target.value,
                    areas: []
                  });
                }}
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                  errors.city ? 'border-red-500' : 'border-white/10'
                } focus:border-cyan-500 focus:outline-none text-white transition-colors appearance-none`}
              >
                <option value="" className="bg-slate-900">Выберите город</option>
                {getCities().map(city => (
                  <option key={city} value={city} className="bg-slate-900">
                    {city}
                  </option>
                ))}
              </select>
              {errors.city && <p className="text-red-400 text-sm mt-1">Пожалуйста, выберите город</p>}
            </div>
          </div>

          {/* Районы обслуживания (показывается только после выбора города) */}
          {formData.city && (
            <div className={`rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border ${
              errors.areas ? 'border-red-500' : 'border-white/20'
            } p-6 transition-colors`}>
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <MapPin className="w-6 h-6 mr-2 text-cyan-400" />
                Районы обслуживания в городе {formData.city} <span className="text-red-400 ml-2">*</span>
              </h2>
              
              {errors.areas && <p className="text-red-400 text-sm -mt-4 mb-4">Пожалуйста, выберите хотя бы один район</p>}

              <div className="grid grid-cols-2 gap-3">
                {getDistricts(formData.city).map((district) => (
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
          )}

          {/* Telegram уведомления */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="text-2xl mr-2">📱</span>
              Telegram уведомления
            </h2>
            {telegramConnected ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-green-500/10 border-2 border-green-500/30">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-green-400 text-lg mb-1">
                        ✅ Telegram уведомления активны
                      </div>
                      <p className="text-sm text-slate-300 mb-3">
                        Вы будете получать мгновенные уведомления о новых заказах в вашем районе прямо в Telegram
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-500/20 text-green-400">
                          <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5 animate-pulse"></span>
                          Активно
                        </span>
                        <span>•</span>
                        <span>Получение заказов включено</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectTelegram}
                  className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
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
                      onClick={handleConnectTelegram}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 disabled:opacity-50 font-semibold shadow-lg transition-all"
                    >
                      {loading ? 'Генерация ссылки...' : '📱 Подключить Telegram'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm text-slate-300 mb-3">
                        <strong>📋 Инструкция:</strong>
                      </p>
                      <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
                        <li>Нажмите кнопку <strong>"Открыть Telegram"</strong> ниже</li>
                        <li>В Telegram нажмите <strong>"START"</strong></li>
                        <li>Готово! Подключение произойдёт автоматически</li>
                      </ol>
                    </div>
                    <a
                      href={telegramDeepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 font-semibold shadow-lg transition-all text-center"
                    >
                      🚀 Открыть Telegram
                    </a>
                    {checkingConnection && (
                      <div className="flex items-center justify-center space-x-2 text-blue-400 bg-blue-500/10 rounded-xl p-3">
                        <Loader className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Ожидание подключения...</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowTelegramInput(false);
                        setCheckingConnection(false);
                      }}
                      className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm"
                    >
                      Отмена
                    </button>
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

            {uploadsDisabled ? (
              <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <div className="font-semibold text-blue-400">
                  {medicStatus === 'APPROVED' ? '✅ Документы верифицированы' : '⏳ Документы на проверке'}
                </div>
                <p className="text-sm text-slate-300 mt-1">
                  {medicStatus === 'APPROVED' 
                    ? 'Ваш профиль верифицирован. Для изменения документов, свяжитесь с поддержкой.' 
                    : 'Ваши документы находятся на проверке. Вы сможете загрузить новые, если профиль будет отклонен.'}
                </p>
              </div>
            ) : (
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
            )}
            
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

