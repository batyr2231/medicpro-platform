"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Upload, Loader, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const CITIES = ['Алматы', 'Астана', 'Шымкент'];

const DISTRICTS: Record<string, string[]> = {
  'Алматы': [
    'Алмалинский',
    'Алатауский',
    'Ауэзовский',
    'Бостандыкский',
    'Жетысуский',
    'Медеуский',
    'Наурызбайский',
    'Турксибский'
  ],
  'Астана': [
    'Алматинский',
    'Есильский',
    'Сарыаркинский',
    'Байконурский'
  ],
  'Шымкент': [
    'Абайский',
    'Аль-Фарабийский',
    'Каратауский',
    'Енбекшинский'
  ]
};

export default function MedicProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    email: '',
    specialization: '',
    experience: '',
    education: '',
    city: 'Алматы',
    areas: [] as string[],
    birthDate: '',
    residenceAddress: '',
    status: 'PENDING',
    telegramChatId: null,
  });

  const [documents, setDocuments] = useState({
    certificate: null as any,
    diploma: null as any,
    license: null as any,
    identity: null as any,
  });

  const [uploading, setUploading] = useState({
    certificate: false,
    diploma: false,
    license: false,
    identity: false,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/medics/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load profile');

      const data = await response.json();
      
      setProfile({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        specialization: data.specialization || '',
        experience: data.experience || '',
        education: data.education || '',
        city: data.city || 'Алматы',
        areas: data.areas || [],
        birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
        residenceAddress: data.residenceAddress || '',
        status: data.status || 'PENDING',
        telegramChatId: data.telegramChatId,
      });

      // Загружаем документы
      const docs = data.documents || [];
      const newDocs: any = {
        certificate: null,
        diploma: null,
        license: null,
        identity: data.identityDocument || null,
      };

      docs.forEach((doc: any) => {
        if (doc.type === 'CERTIFICATE') newDocs.certificate = doc;
        if (doc.type === 'DIPLOMA') newDocs.diploma = doc;
        if (doc.type === 'LICENSE') newDocs.license = doc;
      });

      setDocuments(newDocs);
      
    } catch (error) {
      console.error('Load profile error:', error);
      toast.error('Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Валидация обязательных полей
    if (!profile.name.trim()) {
      toast.error('Введите ФИО');
      return;
    }

    if (!profile.specialization.trim()) {
      toast.error('Выберите специализацию');
      return;
    }

    if (!profile.experience) {
      toast.error('Укажите опыт работы');
      return;
    }

    if (!profile.city) {
      toast.error('Выберите город');
      return;
    }

    if (profile.areas.length === 0) {
      toast.error('Выберите хотя бы один район');
      return;
    }

    if (!profile.birthDate) {
      toast.error('Укажите дату рождения');
      return;
    }

    if (!profile.residenceAddress.trim()) {
      toast.error('Укажите адрес проживания');
      return;
    }

    // Проверка документов
    if (!documents.certificate) {
      toast.error('Загрузите сертификат (обязательно)');
      return;
    }

    if (!documents.diploma) {
      toast.error('Загрузите диплом (обязательно)');
      return;
    }

    if (!documents.identity) {
      toast.error('Загрузите удостоверение личности');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/medics/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          specialization: profile.specialization,
          experience: profile.experience,
          education: profile.education,
          city: profile.city,
          areas: profile.areas,
          birthDate: profile.birthDate,
          residenceAddress: profile.residenceAddress,
        }),
      });

      if (!response.ok) throw new Error('Failed to save profile');

      // Показываем модальное окно успеха
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Save profile error:', error);
      toast.error('Ошибка сохранения профиля');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (type: 'certificate' | 'diploma' | 'license' | 'identity', file: File) => {
    if (!file) return;

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Только JPG, PNG или PDF');
      return;
    }

    // Проверка размера (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой (максимум 10MB)');
      return;
    }

    setUploading({ ...uploading, [type]: true });

    try {
      const token = localStorage.getItem('token');
      
      // Сначала загружаем файл
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const uploadData = await uploadResponse.json();

      // Затем сохраняем документ
      const docFormData = new FormData();
      docFormData.append('document', file);
      docFormData.append('documentType', type.toUpperCase());

      const docResponse = await fetch(`${API_URL}/api/medics/upload-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: docFormData,
      });

      if (!docResponse.ok) throw new Error('Document save failed');

      const docData = await docResponse.json();

      // Обновляем состояние
      setDocuments({
        ...documents,
        [type]: {
          type: type.toUpperCase(),
          url: docData.url,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      toast.success(`${getDocumentName(type)} загружен`);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Ошибка загрузки файла');
    } finally {
      setUploading({ ...uploading, [type]: false });
    }
  };

  const handleDeleteDocument = (type: 'certificate' | 'diploma' | 'license' | 'identity') => {
    if (confirm(`Удалить ${getDocumentName(type)}?`)) {
      setDocuments({
        ...documents,
        [type]: null,
      });
      toast.success(`${getDocumentName(type)} удалён`);
    }
  };

  const getDocumentName = (type: string) => {
    const names: Record<string, string> = {
      certificate: 'Сертификат',
      diploma: 'Диплом',
      license: 'Лицензия',
      identity: 'Удостоверение',
    };
    return names[type] || type;
  };

  const toggleArea = (area: string) => {
    if (profile.areas.includes(area)) {
      setProfile({ ...profile, areas: profile.areas.filter(a => a !== area) });
    } else {
      setProfile({ ...profile, areas: [...profile.areas, area] });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <Loader className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button 
            onClick={() => router.push('/medic/dashboard')}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Профиль медика</h1>

        {/* Основная информация */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Основная информация</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">ФИО *</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                placeholder="Иванов Иван Иванович"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Телефон</label>
              <input
                type="tel"
                value={profile.phone}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Дата рождения *</label>
              <input
                type="date"
                value={profile.birthDate}
                onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Фактический адрес проживания *</label>
              <input
                type="text"
                value={profile.residenceAddress}
                onChange={(e) => setProfile({ ...profile, residenceAddress: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                placeholder="г. Алматы, ул. Абая 123, кв. 45"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Специализация *</label>
              <select
                value={profile.specialization}
                onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Выберите специализацию</option>
                <option value="Терапевт">Терапевт</option>
                <option value="Медсестра">Медсестра</option>
                <option value="Педиатр">Педиатр</option>
                <option value="Кардиолог">Кардиолог</option>
                <option value="Невролог">Невролог</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Опыт работы (лет) *</label>
              <input
                type="number"
                min="0"
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Образование</label>
              <textarea
                value={profile.education}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none resize-none"
                placeholder="Казахский национальный медицинский университет, 2015"
              />
            </div>
          </div>
        </div>

        {/* Город и районы */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">География работы</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Город *</label>
              <select
                value={profile.city}
                onChange={(e) => {
                  setProfile({ ...profile, city: e.target.value, areas: [] });
                }}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
              >
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Районы работы *</label>
              <div className="grid grid-cols-2 gap-2">
                {DISTRICTS[profile.city]?.map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArea(area)}
                    className={`px-4 py-2 rounded-lg border transition-all text-sm ${
                      profile.areas.includes(area)
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Документы */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Документы</h2>
          
          <div className="space-y-4">
            {/* Удостоверение личности */}
            <DocumentUploadBlock
              title="Удостоверение личности *"
              type="identity"
              document={documents.identity}
              uploading={uploading.identity}
              onUpload={(file) => handleFileUpload('identity', file)}
              onDelete={() => handleDeleteDocument('identity')}
            />

            {/* Сертификат */}
            <DocumentUploadBlock
              title="Сертификат *"
              type="certificate"
              document={documents.certificate}
              uploading={uploading.certificate}
              onUpload={(file) => handleFileUpload('certificate', file)}
              onDelete={() => handleDeleteDocument('certificate')}
            />

            {/* Диплом */}
            <DocumentUploadBlock
              title="Диплом *"
              type="diploma"
              document={documents.diploma}
              uploading={uploading.diploma}
              onUpload={(file) => handleFileUpload('diploma', file)}
              onDelete={() => handleDeleteDocument('diploma')}
            />

            {/* Лицензия (опционально) */}
            <DocumentUploadBlock
              title="Медицинская лицензия (по желанию)"
              type="license"
              document={documents.license}
              uploading={uploading.license}
              onUpload={(file) => handleFileUpload('license', file)}
              onDelete={() => handleDeleteDocument('license')}
              optional
            />
          </div>
        </div>

        {/* Кнопка сохранения */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg transition-all flex items-center justify-center"
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
      </div>

      {/* Модальное окно успеха */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-green-500/30 p-8 max-w-md w-full shadow-2xl animate-scale-in">
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

// Компонент для загрузки документа
function DocumentUploadBlock({ 
  title, 
  type, 
  document, 
  uploading, 
  onUpload, 
  onDelete,
  optional = false 
}: {
  title: string;
  type: string;
  document: any;
  uploading: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
  optional?: boolean;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">{title}</label>
        {optional && (
          <span className="text-xs text-slate-400">(необязательно)</span>
        )}
      </div>
      
      {document ? (
        <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm text-green-400">{document.fileName || 'Загружено'}</span>
          </div>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ) : (
        <label className="block">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
            disabled={uploading}
            className="hidden"
          />
          <div className="flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-white/20 hover:border-cyan-500/50 transition-colors cursor-pointer">
            {uploading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin text-cyan-400" />
                <span className="text-sm text-slate-300">Загрузка...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2 text-slate-400" />
                <span className="text-sm text-slate-300">Нажмите для загрузки</span>
              </>
            )}
          </div>
        </label>
      )}
    </div>
  );
}