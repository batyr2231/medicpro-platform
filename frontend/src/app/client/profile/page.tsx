"use client";

import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Heart, Bell, ArrowLeft, Save, Loader, Plus, Trash2, Star, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PhoneInput from '@/components/PhoneInput';
import { getCities, getDistricts } from 'utils/cities';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ClientProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'settings'>('info');

  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    email: '',
    savedAddresses: [] as any[],
    emailNotifications: true,
    smsNotifications: true,
    telegramNotifications: false,
  });

  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
    favoriteMedicsCount: 0,
  });

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/clients/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to load profile');

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.error('Load profile error:', err);
      toast.error('Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/clients/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Load stats error:', err);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile.name.trim()) {
      toast.error('Введите ФИО');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/clients/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          email: profile.email,
          emailNotifications: profile.emailNotifications,
          smsNotifications: profile.smsNotifications,
        }),
      });

      if (!response.ok) throw new Error('Failed to save profile');

      toast.success('✅ Профиль сохранён!');

      // Обновляем локальное хранилище
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.name = profile.name;
      user.phone = profile.phone;
      user.email = profile.email;
      localStorage.setItem('user', JSON.stringify(user));

    } catch (err: any) {
      console.error('Save profile error:', err);
      toast.error('Ошибка сохранения: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress({
      id: Date.now().toString(),
      city: 'Алматы',
      district: '',
      street: '',
      apartment: '',
      isDefault: profile.savedAddresses.length === 0,
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (address: any) => {
    try {
      const token = localStorage.getItem('token');
      const newAddresses = editingAddress.id && profile.savedAddresses.find(a => a.id === editingAddress.id)
        ? profile.savedAddresses.map(a => a.id === address.id ? address : a)
        : [...profile.savedAddresses, address];

      const response = await fetch(`${API_URL}/api/clients/addresses`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ addresses: newAddresses }),
      });

      if (!response.ok) throw new Error('Failed to save address');

      setProfile({ ...profile, savedAddresses: newAddresses });
      setShowAddressModal(false);
      setEditingAddress(null);
      toast.success('✅ Адрес сохранён!');

    } catch (err: any) {
      console.error('Save address error:', err);
      toast.error('Ошибка сохранения адреса');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Удалить этот адрес?')) return;

    try {
      const token = localStorage.getItem('token');
      const newAddresses = profile.savedAddresses.filter(a => a.id !== addressId);

      const response = await fetch(`${API_URL}/api/clients/addresses`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ addresses: newAddresses }),
      });

      if (!response.ok) throw new Error('Failed to delete address');

      setProfile({ ...profile, savedAddresses: newAddresses });
      toast.success('✅ Адрес удалён!');

    } catch (err: any) {
      console.error('Delete address error:', err);
      toast.error('Ошибка удаления адреса');
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
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push('/client/orders')}
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
        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 p-4">
            <Package className="w-8 h-8 text-cyan-400 mb-2" />
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <div className="text-sm text-slate-400">Заказов</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 p-4">
            <Star className="w-8 h-8 text-green-400 mb-2" />
            <div className="text-2xl font-bold">{stats.completedOrders}</div>
            <div className="text-sm text-slate-400">Завершено</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-4">
            <Heart className="w-8 h-8 text-purple-400 mb-2" />
            <div className="text-2xl font-bold">{stats.favoriteMedicsCount}</div>
            <div className="text-sm text-slate-400">Избранных</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 p-4">
            <div className="text-2xl font-bold">{stats.totalSpent.toLocaleString('ru-RU')}</div>
            <div className="text-sm text-slate-400">₸ потрачено</div>
          </div>
        </div>

        {/* Табы */}
        <div className="flex space-x-2 mb-6 border-b border-white/10">
          {[
            { id: 'info', label: 'Информация', icon: User },
            { id: 'addresses', label: 'Адреса', icon: MapPin },
            { id: 'settings', label: 'Настройки', icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Личная информация */}
        {activeTab === 'info' && (
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-6">Личная информация</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">ФИО *</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Телефон</label>
                <PhoneInput
                  value={profile.phone}
                  onChange={(value) => setProfile({ ...profile, phone: value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email (необязательно)</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white"
                  placeholder="example@mail.com"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 font-semibold transition-all flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Сохранить изменения
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Адреса */}
        {activeTab === 'addresses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Сохранённые адреса</h2>
              <button
                onClick={handleAddAddress}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-all flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Добавить адрес
              </button>
            </div>

            {profile.savedAddresses.length === 0 ? (
              <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-12 text-center">
                <MapPin className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">Нет сохранённых адресов</p>
                <button
                  onClick={handleAddAddress}
                  className="px-6 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-all"
                >
                  Добавить первый адрес
                </button>
              </div>
            ) : (
              profile.savedAddresses.map((address) => (
                <div
                  key={address.id}
                  className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {address.isDefault && (
                        <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium mb-2">
                          Основной адрес
                        </span>
                      )}
                      <div className="text-lg font-semibold mb-1">
                        {address.city}, {address.district}
                      </div>
                      <div className="text-slate-400">
                        {address.street}, {address.apartment}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Настройки уведомлений */}
        {activeTab === 'settings' && (
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-6">Настройки уведомлений</h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="font-medium">Email уведомления</div>
                    <div className="text-sm text-slate-400">Получать уведомления на почту</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profile.emailNotifications}
                  onChange={(e) => setProfile({ ...profile, emailNotifications: e.target.checked })}
                  className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-cyan-500 checked:border-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="font-medium">SMS уведомления</div>
                    <div className="text-sm text-slate-400">Получать SMS о статусе заказов</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profile.smsNotifications}
                  onChange={(e) => setProfile({ ...profile, smsNotifications: e.target.checked })}
                  className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-cyan-500 checked:border-cyan-500"
                />
              </label>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 font-semibold transition-all flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Сохранить настройки
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно добавления адреса */}
      {showAddressModal && (
        <AddressModal
          address={editingAddress}
          onSave={handleSaveAddress}
          onClose={() => {
            setShowAddressModal(false);
            setEditingAddress(null);
          }}
        />
      )}
    </div>
  );
}

// Модальное окно для адреса
function AddressModal({ address, onSave, onClose }: any) {
  const [formData, setFormData] = useState(address);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 p-8 max-w-md w-full shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-6">
          {address.street ? 'Редактировать адрес' : 'Новый адрес'}
        </h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Город *</label>
            <select
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value, district: '' })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white"
            >
              {getCities().map(city => (
                <option key={city} value={city} className="bg-slate-900">{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Район *</label>
            <select
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white"
            >
              <option value="">Выберите район</option>
              {getDistricts(formData.city).map(district => (
                <option key={district} value={district} className="bg-slate-900">{district}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Улица, дом *</label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="ул. Абая, 123"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Квартира/Офис</label>
            <input
              type="text"
              value={formData.apartment}
              onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
              placeholder="кв. 45"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white"
            />
          </div>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-cyan-500 checked:border-cyan-500"
            />
            <span className="text-sm text-slate-300">Сделать основным адресом</span>
          </label>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => {
              if (!formData.city || !formData.district || !formData.street) {
                toast.error('Заполните все обязательные поля');
                return;
              }
              onSave(formData);
            }}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold transition-all"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}