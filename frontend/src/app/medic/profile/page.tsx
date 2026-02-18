"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { User, Phone, MapPin, Award, Save, Loader, ArrowLeft, Upload, X, CheckCircle, DollarSign, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PhoneInput from '@/components/PhoneInput'; 
import { getCities, getDistricts } from 'utils/cities';
import ProcedureSelector from '@/components/ProcedureSelector';


export default function MedicProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [showTelegramInput, setShowTelegramInput] = useState(false);
  const [telegramDeepLink, setTelegramDeepLink] = useState('');
  const [checkingConnection, setCheckingConnection] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [medicAvatar, setMedicAvatar] = useState<string | null>(null);
  // Баланс медика
  const [balance, setBalance] = useState<any>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Модалка оплаты
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingCommission, setPendingCommission] = useState<any>(null);
  
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
    availableProcedures: [] as string[],
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
    loadBalance();
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
          availableProcedures: result.availableProcedures || [],
        });
        
        setAgreedToTerms(result.agreedToTerms || false);
        setMedicStatus(result.status || 'PENDING');
        setMedicAvatar(result.avatar || null);
        
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

  const loadBalance = async () => {
    try {
      setLoadingBalance(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/medics/balance`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setBalance(result);
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const loadPendingCommission = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/medics/pending-commission`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setPendingCommission(result);
        setShowPaymentModal(true);
      }
    } catch (err) {
      console.error('Failed to load pending commission:', err);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/medics/confirm-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: pendingCommission.pendingCommission
          })
        }
      );

      if (response.ok) {
        toast.success('✅ Спасибо! Проверим платёж в течение 24 часов', {
          duration: 5000
        });
        setShowPaymentModal(false);
        setPendingCommission(null);
        loadBalance(); // Обновляем баланс
      } else {
        throw new Error('Failed to confirm payment');
      }
    } catch (err) {
      toast.error('❌ Ошибка подтверждения оплаты');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

     if (!formData.education.trim()) {
      toast.error('Укажите образование');
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

    if (formData.availableProcedures.length === 0) {
      toast.error('Выберите хотя бы одну процедуру');
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
            availableProcedures: formData.availableProcedures,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      // ✅ ИСПРАВЛЕНО: Обновляем статус на PENDING после сохранения
      setMedicStatus('PENDING');
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

  // ✅ ИСПРАВЛЕНО: Загрузка удостоверения БЕЗ модалки и БЕЗ перезагрузки страницы
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

      // ✅ ПРОСТО обновляем состояние без модалки
      setIdentityDoc({ type: 'IDENTITY', url: result.url });
      toast.success('Документ загружен', { duration: 2000 });

    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Ошибка загрузки: ' + err.message);
    } finally {
      setUploadingIdentity(false);
    }
  };

  // ✅ ИСПРАВЛЕНО: Загрузка сертификата БЕЗ модалки и БЕЗ перезагрузки
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

      // ✅ Добавляем сертификат в список БЕЗ перезагрузки страницы
      setCertificates([...certificates, { type: 'CERTIFICATE', url: result.url }]);
      toast.success('Сертификат загружен', { duration: 2000 });

    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Ошибка загрузки: ' + err.message);
    } finally {
      setUploadingCertificate(false);
    }
  };

  // ✅ ИСПРАВЛЕНО: Загрузка лицензии БЕЗ модалки и БЕЗ перезагрузки
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

      // ✅ Обновляем лицензию БЕЗ перезагрузки страницы
      setLicense({ type: 'LICENSE', url: result.url });
      toast.success('Лицензия загружена', { duration: 2000 });

    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Ошибка загрузки: ' + err.message);
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
              <span>{t('common.back')}</span>
            </button>
            <h1 className="text-xl font-bold">{t('profile.myProfile')}</h1>
            <LanguageSwitcher />
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
              <div className="font-bold text-green-400 text-lg">✅ {t('admin.approved')}</div>
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
              <div className="font-bold text-yellow-400 text-lg">⏳ {t('admin.pending')}</div>
              <div className="text-sm text-slate-400">Ваш профиль проверяется администрацией</div>
            </div>
          </div>
        )}
      </div>

      {/* Фото профиля */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📸 {t('profile.photo')}</h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Аватар */}
            <div className="relative">
              {medicAvatar ? (
                <img
                  src={medicAvatar}
                  alt={formData.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500/30"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-5xl font-bold">
                  {formData.name?.[0] || '?'}
                </div>
              )}
              
              {medicAvatar && (
                <button
                  onClick={async () => {
                    if (!confirm('Удалить фото?')) return;
                    
                    try {
                      const token = localStorage.getItem('token');
                      const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/medics/avatar`,
                        {
                          method: 'DELETE',
                          headers: { 'Authorization': `Bearer ${token}` }
                        }
                      );

                      if (!response.ok) throw new Error('Failed to delete');

                      toast.success('✅ Фото удалено');
                      setMedicAvatar(null);
                    } catch (err) {
                      console.error('Delete avatar error:', err);
                      toast.error('❌ Ошибка удаления фото');
                    }
                  }}
                  className="absolute -top-2 -right-2 p-2 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Загрузка */}
            <div className="flex-1 w-full">
              <p className="text-sm text-slate-400 mb-3">
                Загрузите ваше фото (макс. 2MB, JPEG/PNG)
              </p>
              
              <input
                type="file"
                id="avatar-upload"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  if (file.size > 2 * 1024 * 1024) {
                    toast.error('❌ Файл слишком большой (макс. 2MB)');
                    return;
                  }

                  setUploading(true);

                  try {
                    const formData = new FormData();
                    formData.append('avatar', file);

                    const token = localStorage.getItem('token');
                    const response = await fetch(
                      `${process.env.NEXT_PUBLIC_API_URL}/api/medics/upload-avatar`,
                      {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                      }
                    );

                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || 'Upload failed');
                    }

                    const result = await response.json();
                    toast.success('✅ Фото загружено');
                    setMedicAvatar(result.url);
                    e.target.value = '';
                  } catch (err: any) {
                    console.error('Upload avatar error:', err);
                    toast.error('❌ ' + err.message);
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              <label
                htmlFor="avatar-upload"
                className={`block w-full py-3 rounded-xl text-center font-semibold transition-all cursor-pointer ${
                  uploading
                    ? 'bg-white/5 text-slate-400 cursor-not-allowed'
                    : 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30'
                }`}
              >
                {uploading ? (
                  <span className="flex items-center justify-center">
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Загрузка...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Upload className="w-5 h-5 mr-2" />
                    {medicAvatar ? 'Изменить фото' : 'Загрузить фото'}
                  </span>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Баланс медика */}
      {medicStatus === 'APPROVED' && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-xl border-2 border-emerald-500/30 p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="text-3xl mr-3">💰</span>
              Баланс и выплаты
            </h2>

            {loadingBalance ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-8 h-8 animate-spin text-emerald-400" />
              </div>
            ) : balance ? (
              <div className="space-y-6">
                {/* Карточки статистики */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Всего заработано */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                    <div className="text-sm text-blue-300 mb-1">Всего заработано</div>
                    <div className="text-2xl font-bold text-white">
                      {balance.totalEarned.toLocaleString('ru-RU')} ₸
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {balance.transactions?.length || 0} заказов
                    </div>
                  </div>

{/* Комиссия к оплате */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                    <div className="text-sm text-yellow-300 mb-1">Комиссия к оплате</div>
                    <div className="text-2xl font-bold text-white">
                      {balance.totalCommission.toLocaleString('ru-RU')} ₸
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Необходимо перевести</div>
                  </div>

                  {/* Выплачено */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
                    <div className="text-sm text-emerald-300 mb-1">Выплачено</div>
                    <div className="text-2xl font-bold text-white">
                      {balance.totalPaid.toLocaleString('ru-RU')} ₸
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Получено на руки</div>
                  </div>
                </div>

 {/* Кнопка оплаты комиссии */}
                {balance.totalCommission > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={loadPendingCommission}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 font-bold text-lg shadow-lg transition-all animate-pulse flex items-center justify-center"
                    >
                      <DollarSign className="w-6 h-6 mr-2" />
                      💰 Оплатить комиссию {balance.totalCommission.toLocaleString('ru-RU')} ₸
                    </button>
                  </div>
                )}

                {/* История транзакций */}
                {balance.transactions && balance.transactions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                      <span className="mr-2">📋</span>
                      История выплат
                    </h3>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {balance.transactions.slice(0, 10).map((tx: any) => (
                        <div
                          key={tx.id}
                          className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">💉</span>
                              <div>
                                <div className="font-medium text-sm">
                                  {tx.serviceType}
                                </div>
                                <div className="text-xs text-slate-400">
                                  Заказ #{tx.orderNumber}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-bold text-emerald-400">
                                +{tx.netAmount.toLocaleString('ru-RU')} ₸
                              </div>
                              <div className="text-xs text-slate-500">
                                -{tx.commission.toLocaleString('ru-RU')} ₸ комиссия
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="text-slate-400">
                              {new Date(tx.createdAt).toLocaleDateString('ru-RU')}
                            </div>
                            <div>
                              {tx.status === 'PAID' ? (
                                <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  ✓ Выплачено
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                  ⏳ Ожидает
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {balance.transactions.length > 10 && (
                      <div className="mt-3 text-center text-sm text-slate-400">
                        Показано 10 из {balance.transactions.length} транзакций
                      </div>
                    )}
                  </div>
                )}

                {/* Информация о комиссии */}
                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">ℹ️</div>
                    <div className="text-sm text-cyan-300">
                      <p className="font-medium mb-2">Как работают выплаты:</p>
                      <ul className="list-disc list-inside space-y-1 text-cyan-400/80">
                         <li>Комиссия платформы: 10%</li>
                        <li>Клиент платит вам наличными всю сумму</li>
                        <li>Вы переводите комиссию платформе через Kaspi</li>
                        <li>Оплата проверяется администратором в течение 24 часов</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p>Нет данных о балансе</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Основная форма */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <User className="w-6 h-6 mr-2 text-cyan-400" />
              {t('profile.personalInfo')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('profile.name')} *
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
                  {t('auth.phone')}
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
                  {t('profile.birthDate')} *
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
                  {t('profile.residenceAddress')} *
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
              {t('profile.professionalInfo')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('profile.specialization')} *
                </label>
                <select
                  value={formData.specialization}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white transition-colors appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.5em 1.5em',
                  }}
                  required
                >
                  <option value="" className="bg-slate-900">Выберите специализацию</option>
                  <option value="Терапевт" className="bg-slate-900">Терапевт</option>
                  <option value="Медсестра" className="bg-slate-900">Медсестра / Фельдшер</option>
                  <option value="Педиатр" className="bg-slate-900">Педиатр</option>
                  <option value="Врач общей практики" className="bg-slate-900">Врач общей практики</option>
                </select>
                <p className="text-xs text-slate-400 mt-2">
                  💡 Выберите основную специализацию. Для фельдшеров → "Медсестра / Фельдшер"
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('profile.experience')} *
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
                  {t('profile.education')}
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

          {/* Процедуры */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <span className="text-2xl mr-2">💊</span>
              {t('medic.procedures')}
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Какие процедуры вы можете выполнять? *
              </label>
              <p className="text-xs text-slate-400 mb-4">
                💡 Выберите все процедуры, которые вы квалифицированы выполнять. 
                Клиенты будут видеть это при выборе медика.
              </p>
              
              <ProcedureSelector
                selectedProcedures={formData.availableProcedures}
                onChange={(procedures) => handleChange('availableProcedures', procedures)}
                required={true}
              />
            </div>
          </div>

          {/* Город */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-2 text-cyan-400" />
              {t('order.city')}
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
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border -cyan-500 focus:outline-none text-white transition-colors appearance-none cursor-pointer"
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
                {t('medic.districts')} *
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
                        if (file) {
                          handleUploadIdentity(file);
                          e.target.value = ''; // Очищаем input
                        }
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

              {/* Сертификаты/Дипломы */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Сертификаты / Дипломы <span className="text-red-400">*</span>
                  <span className="text-xs text-slate-400 ml-2">(можно загрузить несколько)</span>
                </label>
                
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
                
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadCertificate(file);
                        e.target.value = ''; // Очищаем input
                      }
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
                        <span className="text-sm">
                          {certificates.length > 0 ? 'Загрузить ещё один' : 'Нажмите для загрузки'}
                        </span>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* Лицензия */}
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
                        if (file) {
                          handleUploadLicense(file);
                          e.target.value = ''; // Очищаем input
                        }
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
                  в том числе с выплатой комиссии <strong className="text-yellow-400">10%</strong>
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
                {t('profile.saveProfile')}...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {t('profile.saveProfile')}
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
                ✅ {t('profile.profileSaved')}!
              </h3>
              <p className="text-slate-300 mb-6">
                Ваш профиль успешно сохранён и отправлен на модерацию. 
                Ожидайте подтверждения в течение 24 часов.
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/medic/dashboard');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold transition-all"
              >
                Перейти в дашборд
              </button>
            </div>
          </div>
        </div>
      )}
             {/* ✅ МОДАЛЬНОЕ ОКНО ОПЛАТЫ */}
      {showPaymentModal && pendingCommission && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">💰 Оплата комиссии</h2>
                <p className="text-sm text-slate-400">
                  Переведите комиссию платформе через Kaspi
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              
              {/* Накопленный долг */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30">
                <div className="text-center">
                  <div className="text-sm text-yellow-300 mb-2">Комиссия к оплате (10%)</div>
                  <div className="text-5xl font-bold text-white mb-1">
                    {pendingCommission.pendingCommission.toLocaleString('ru-RU')} ₸
                  </div>
                  <div className="text-xs text-yellow-400">
                    {pendingCommission.ordersCount} завершённых заказов
                  </div>
                </div>
              </div>

              {/* Детализация */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs text-slate-400 mb-3">💡 Как считается:</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Вы получили от клиентов:</span>
                    <span className="font-bold text-white">
                      {pendingCommission.totalReceived.toLocaleString('ru-RU')} ₸
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Комиссия (10%):</span>
                    <span className="font-bold text-yellow-400">
                      -{pendingCommission.pendingCommission.toLocaleString('ru-RU')} ₸
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between">
                    <span className="text-slate-300">Ваш чистый доход:</span>
                    <span className="font-bold text-green-400">
                      {pendingCommission.netIncome.toLocaleString('ru-RU')} ₸
                    </span>
                  </div>
                </div>
              </div>

              {/* QR КОД */}
              <div>
                <div className="text-center mb-3">
                  <div className="text-sm font-semibold text-cyan-400 mb-2">
                    📱 Способ 1: Отсканируйте QR-код
                  </div>
                </div>
                
                <div className="p-6 rounded-2xl bg-white flex items-center justify-center">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/4108/4108690.png" 
                    alt="Kaspi QR" 
                    className="w-48 h-48"
                  />
                </div>
                
                <p className="text-xs text-center text-slate-400 mt-3">
                  Откройте камеру в Kaspi и отсканируйте код
                </p>
              </div>

              {/* РАЗДЕЛИТЕЛЬ */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-900 text-slate-400">или</span>
                </div>
              </div>

              {/* НОМЕР ТЕЛЕФОНА */}
              <div>
                <div className="text-center mb-3">
                  <div className="text-sm font-semibold text-cyan-400 mb-2">
                    💳 Способ 2: Перевод по номеру телефона
                  </div>
                </div>
                
                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30">
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-2">Номер телефона Kaspi:</div>
                    <div className="font-mono text-3xl font-bold text-cyan-400 mb-3">
                      +7 707 123 45 67
                    </div>
                    <div className="text-sm text-slate-300 mb-1">На имя:</div>
                    <div className="text-lg font-semibold text-white">MedicPro Platform</div>
                  </div>
                  
                  {/* Кнопка копирования */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('+77071234567');
                      toast.success('📋 Номер скопирован!');
                    }}
                    className="w-full mt-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 text-sm font-medium transition-all flex items-center justify-center"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Скопировать номер
                  </button>
                </div>
              </div>

              {/* ИНСТРУКЦИЯ */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">📋</div>
                  <div className="text-sm text-blue-300">
                    <p className="font-semibold mb-2">Как оплатить:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-400/90">
                      <li>Откройте Kaspi на телефоне</li>
                      <li>Выберите "Переводы" или отсканируйте QR</li>
                      <li>Введите сумму: <strong>{pendingCommission.pendingCommission.toLocaleString('ru-RU')} ₸</strong></li>
                      <li>Отправьте перевод</li>
                      <li>Нажмите "Я оплатил" ниже</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* КНОПКИ */}
              <div className="space-y-3">
                <button
                  onClick={handleConfirmPayment}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 font-bold text-lg shadow-lg transition-all flex items-center justify-center"
                >
                  <CheckCircle className="w-6 h-6 mr-2" />
                  ✓ Я оплатил комиссию
                </button>
                
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium transition-all"
                >
                  Оплачу позже
                </button>
              </div>

              {/* ПРЕДУПРЕЖДЕНИЕ */}
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-xs text-yellow-300 text-center mb-2">
                  ⚠️ Оплатите комиссию до <strong>00:00 сегодня</strong>
                </p>
                <p className="text-xs text-yellow-400/80 text-center">
                  Иначе завтра вы не сможете получать новые заказы
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}