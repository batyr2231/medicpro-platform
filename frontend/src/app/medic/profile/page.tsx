"use client";

import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Award, Save, Loader, ArrowLeft, Upload, X, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PhoneInput from '@/components/PhoneInput'; 
import { getCities, getDistricts } from 'utils/cities';


export default function MedicProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
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
    birthDate: '',
    residenceAddress: '',
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [medicStatus, setMedicStatus] = useState<string>('PENDING');
  
  // Документы
  const [identityDoc, setIdentityDoc] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [license, setLicense] = useState<any>(null);
  
  const [uploadingIdentity, setUploadingIdentity] = useState(false);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);

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
          city: result.city || 'Алматы',
          areas: result.areas || [],
          birthDate: result.birthDate ? new Date(result.birthDate).toISOString().split('T')[0] : '',
          residenceAddress: result.residenceAddress || '',
        });
        
        setAgreedToTerms(result.agreedToTerms || false);

        setMedicStatus(result.status || 'PENDING');
        
        if (result.telegramChatId) {
          setTelegramConnected(true);
        }

        // Загружаем документы
        setIdentityDoc(result.identityDocument || null);
        
        const docs = result.documents || [];
        const certs = docs.filter((d: any) => d.type === 'CERTIFICATE');
        const lic = docs.find((d: any) => d.type === 'LICENSE');
        
        setCertificates(certs);
        setLicense(lic || null);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      toast.error('Не удалось загрузить профиль');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    // ← ДОБАВИТЬ:
    if (!agreedToTerms) {
      toast.error('Необходимо согласиться с договором-офертой');
      return;
    }
    // Валидация
    if (!formData.name.trim()) {
      toast.error('Введите ФИО');
      return;
    }

    if (!formData.specialization.trim()) {
      toast.error('Выберите специализацию');
      return;
    }

    if (!formData.experience || parseInt(formData.experience) === 0) {
      toast.error('Укажите опыт работы');
      return;
    }

    if (!formData.city) {
      toast.error('Выберите город');
      return;
    }

    if (formData.areas.length === 0) {
      toast.error('Выберите хотя бы один район');
      return;
    }

    if (!formData.birthDate) {
      toast.error('Укажите дату рождения');
      return;
    }

    if (!formData.residenceAddress.trim()) {
      toast.error('Укажите адрес проживания');
      return;
    }

    // Проверка документов
    if (!identityDoc) {
      toast.error('Загрузите удостоверение личности (обязательно)');
      return;
    }

    if (certificates.length === 0) {
      toast.error('Загрузите хотя бы один сертификат/диплом (обязательно)');
      return;
    }

    setSaving(true);

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
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            specialization: formData.specialization,
            experience: formData.experience,
            education: formData.education,
            city: formData.city,
            areas: formData.areas,
            birthDate: formData.birthDate,
            residenceAddress: formData.residenceAddress,
            agreedToTerms: agreedToTerms,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      // Показываем модальное окно
      setShowSuccessModal(true);
      
    } catch (err: any) {
      console.error('Update profile error:', err);
      toast.error('Ошибка обновления профиля: ' + err.message);
    } finally {
      setSaving(false);
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

  // Загрузка удостоверения
  const handleUploadIdentity = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой (максимум 10MB)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Можно загружать только изображения');
      return;
    }

    setUploadingIdentity(true);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', 'IDENTITY');

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/medics/upload-document`,
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
        throw new Error(result.error || 'Ошибка загрузки');
      }

      toast.success('✅ Удостоверение загружено!');
      loadProfile();

    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('❌ Ошибка загрузки: ' + err.message);
    } finally {
      setUploadingIdentity(false);
    }
  };

  // Загрузка сертификата/диплома (множественная)
  const handleUploadCertificate = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой (максимум 10MB)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Можно загружать только изображения');
      return;
    }

    setUploadingCertificate(true);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', 'CERTIFICATE');

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/medics/upload-document`,
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
        throw new Error(result.error || 'Ошибка загрузки');
      }

      toast.success('✅ Сертификат/Диплом загружен!');
      loadProfile();

    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('❌ Ошибка загрузки: ' + err.message);
    } finally {
      setUploadingCertificate(false);
    }
  };

  // Загрузка лицензии (одна, заменяется)
  const handleUploadLicense = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой (максимум 10MB)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Можно загружать только изображения');
      return;
    }

    setUploadingLicense(true);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', 'LICENSE');

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/medics/upload-document`,
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
        throw new Error(result.error || 'Ошибка загрузки');
      }

      toast.success('✅ Лицензия загружена!');
      loadProfile();

    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('❌ Ошибка загрузки: ' + err.message);
    } finally {
      setUploadingLicense(false);
    }
  };

  const handleConnectTelegram = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/medics/generate-telegram-code`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const result = await response.json();

      if (response.ok) {
        setTelegramDeepLink(result.deepLink);
        setShowTelegramInput(true);
        
        toast.success('✅ Ссылка готова! Откройте Telegram');
        
        startCheckingConnection();
      } else {
        toast.error('❌ ' + result.error);
      }
    } catch (error) {
      console.error('Connect Telegram error:', error);
      toast.error('❌ Ошибка генерации ссылки');
    } finally {
      setLoading(false);
    }
  };

  const startCheckingConnection = () => {
    setCheckingConnection(true);
    
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/medics/profile`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        const result = await response.json();
        
        if (result.telegramChatId) {
          setTelegramConnected(true);
          setShowTelegramInput(false);
          setCheckingConnection(false);
          clearInterval(interval);
          toast.success('🎉 Telegram успешно подключён!');
        }
      } catch (error) {
        console.error('Check connection error:', error);
      }
    }, 3000);
    
    setTimeout(() => {
      clearInterval(interval);
      setCheckingConnection(false);
    }, 120000);
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

  const isProfileComplete = 
    formData.name && 
    formData.phone && 
    formData.specialization && 
    formData.experience && parseInt(formData.experience) > 0 &&
    formData.city && 
    formData.areas.length > 0 &&
    formData.birthDate &&
    formData.residenceAddress;

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

      {/* Статус профиля */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        {medicStatus === 'APPROVED' && (
          <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-400" />
            </div>
            <div>
              <div className="font-bold text-green-400 text-lg">✅ Профиль верифицирован</div>
              <div className="text-sm text-slate-400">Ваши документы проверены администрацией</div>
            </div>
          </div>
        )}

        {medicStatus === 'PENDING' && (
          <div className="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Loader className="w-7 h-7 text-yellow-400 animate-spin" />
            </div>
            <div>
              <div className="font-bold text-yellow-400 text-lg">⏳ На модерации</div>
              <div className="text-sm text-slate-400">Ваш профиль проверяется администрацией</div>
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
                  ФИО *
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

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Дата рождения *
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleChange('birthDate', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Фактический адрес проживания *
                </label>
                <input
                  type="text"
                  value={formData.residenceAddress}
                  onChange={(e) => handleChange('residenceAddress', e.target.value)}
                  placeholder="г. Алматы, ул. Абая 123, кв. 45"
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
                  Специализация *
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                  placeholder="Например: Терапевт, Медсестра"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Опыт работы (лет) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.experience}
                  onChange={(e) => handleChange('experience', e.target.value)}
                  placeholder="Например: 5"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors"
                  required
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

          {/* Город */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-2 text-cyan-400" />
              Город работы
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                В каком городе вы работаете? *
              </label>
              <select
                value={formData.city}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    city: e.target.value,
                    areas: []
                  });
                }}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.5em 1.5em',
                }}
                required
              >
                <option value="" className="bg-slate-900 text-white">Выберите город</option>
                {getCities().map(city => (
                  <option key={city} value={city} className="bg-slate-900 text-white py-2">
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Районы */}
          {formData.city && (
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <MapPin className="w-6 h-6 mr-2 text-cyan-400" />
                Районы обслуживания *
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {getDistricts(formData.city).map((district) => (
                  <button
                    key={district}
                    type="button"
                    onClick={() => toggleDistrict(district)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      formData.areas.includes(district)
                        ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500'
                        : 'bg-white/5 border-2 border-white/10 hover:border-white/20'
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

          {/* Документы */}
          {isProfileComplete && (
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
              <h2 className="text-xl font-bold mb-6">Документы для верификации</h2>
              
              {/* Удостоверение личности */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Удостоверение личности <span className="text-red-400">*</span>
                </label>
                {identityDoc ? (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-green-400">Загружено</span>
                    </div>
                  </div>
                ) : (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadIdentity(file);
                      }}
                      disabled={uploadingIdentity}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center p-8 rounded-xl border-2 border-dashed border-white/20 hover:border-cyan-500/50 cursor-pointer transition-all">
                      {uploadingIdentity ? (
                        <>
                          <Loader className="w-5 h-5 mr-2 animate-spin text-cyan-400" />
                          <span className="text-sm">Загрузка...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2 text-slate-400" />
                          <span className="text-sm">Нажмите для загрузки</span>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>

              {/* Сертификаты/Дипломы (множественная загрузка) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Сертификаты / Дипломы <span className="text-red-400">*</span>
                  <span className="text-xs text-slate-400 ml-2">(можно загрузить несколько)</span>
                </label>
                
                {/* Показываем загруженные сертификаты */}
                {certificates.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {certificates.map((cert, index) => (
                      <div key={index} className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-sm text-green-400">Сертификат {index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Кнопка загрузки еще одного */}
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadCertificate(file);
                    }}
                    disabled={uploadingCertificate}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center p-8 rounded-xl border-2 border-dashed border-white/20 hover:border-cyan-500/50 cursor-pointer transition-all">
                    {uploadingCertificate ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin text-cyan-400" />
                        <span className="text-sm">Загрузка...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2 text-slate-400" />
                        <span className ="text-sm">
                          {certificates.length > 0 ? 'Загрузить ещё один' : 'Нажмите для загрузки'}
                        </span>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* Медицинская лицензия (необязательно) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Медицинская лицензия
                  <span className="text-xs text-slate-400 ml-2">(необязательно)</span>
                </label>
                {license ? (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-green-400">Лицензия загружена</span>
                    </div>
                  </div>
                ) : (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadLicense(file);
                      }}
                      disabled={uploadingLicense}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center p-8 rounded-xl border-2 border-dashed border-white/20 hover:border-cyan-500/50 cursor-pointer transition-all">
                      {uploadingLicense ? (
                        <>
                          <Loader className="w-5 h-5 mr-2 animate-spin text-cyan-400" />
                          <span className="text-sm">Загрузка...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2 text-slate-400" />
                          <span className="text-sm">Нажмите для загрузки</span>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>

              {/* Информация */}
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">📋</div>
                  <div className="text-sm text-cyan-300">
                    <p className="font-medium mb-2">Что нужно загрузить:</p>
                    <ul className="list-disc list-inside space-y-1 text-cyan-400/80">
                      <li>Удостоверение личности (обязательно)</li>
                      <li>Сертификаты и/или дипломы (обязательно, можно несколько)</li>
                      <li>Медицинская лицензия (по желанию)</li>
                    </ul>
                    <p className="mt-2 text-xs text-cyan-400/60">
                      Документы будут проверены администратором в течение 24 часов
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Telegram */}
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
                      <CheckCircle className="w-7 h-7 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-green-400 text-lg mb-1">
                        ✅ Telegram уведомления активны
                      </div>
                      <p className="text-sm text-slate-300 mb-3">
                        Вы будете получать мгновенные уведомления о новых заказах
                      </p>
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
                        <li>Нажмите кнопку <strong>"Открыть Telegram"</strong></li>
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

          {/* Договор-оферта */}
          <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-xl border-2 border-orange-500/30 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="text-2xl mr-2">📋</span>
              Договор-оферта
            </h2>
            
            <div className="space-y-4">
              <p className="text-slate-300 text-sm">
                Для работы на платформе необходимо ознакомиться и согласиться с условиями договора-оферты.
              </p>

              <button
                type="button"
                onClick={() => router.push('/medic/terms')}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-cyan-400 font-medium"
              >
                📄 Читать договор-оферту
              </button>

              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-cyan-500 checked:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all cursor-pointer"
                />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                  Я прочитал(а) и согласен(на) с условиями <strong className="text-white">Договора-оферты</strong>, 
                  в том числе с выплатой комиссии <strong className="text-yellow-400">50%</strong> от суммы заказа
                </span>
              </label>

              {!agreedToTerms && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-400">Необходимо согласие для продолжения</span>
                </div>
              )}
            </div>
          </div>

          {/* Кнопка сохранения */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 font-semibold shadow-lg transition-all flex items-center justify-center"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Сохранить профиль
              </>
            )}
          </button>
        </form>
      </div>

      {/* Модальное окно успеха */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-green-500/30 p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Профиль сохранён!
              </h3>
              <p className="text-slate-300 mb-6">
                Благодарим за заполнение профиля. Ваша заявка отправлена на модерацию. 
                Ожидайте подтверждения в течение 24 часов.
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/medic/dashboard');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold transition-all"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}