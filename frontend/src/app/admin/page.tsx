"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Users, Package, AlertTriangle, TrendingUp, CheckCircle, XCircle, Eye, Loader, ArrowLeft, X, FileText, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MEDICAL_PROCEDURES, getProcedureName, getProcedureIcon } from '@/utils/procedures';


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('medics');
  const [medics, setMedics] = useState([]);
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [complaintFilter, setComplaintFilter] = useState('ALL');
  
  // Модальное окно для документов
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedMedicDocs, setSelectedMedicDocs] = useState<any>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [chats, setChats] = useState([]);

  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [activeTab, complaintFilter]);

  const loadData = () => {
    if (activeTab === 'medics') {
      loadMedics();
    } else if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'complaints') {
      loadComplaints();
    } else if (activeTab === 'stats') {
      loadStats();
    } else if (activeTab === 'chats') { // ← ДОБАВИТЬ
      loadChats();
    }
  };

  const loadMedics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/medics`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (response.ok) {
        setMedics(result);
      }
    } catch (err) {
      toast.error('Ошибка загрузки медиков');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/orders`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (response.ok) {
        setOrders(result);
      }
    } catch (err) {
      toast.error('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/complaints`;
      
      if (complaintFilter && complaintFilter !== 'ALL') {
        url += `?status=${complaintFilter}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        setComplaints(result);
      }
    } catch (err) {
      toast.error('Ошибка загрузки жалоб');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (response.ok) {
        setStats(result);
      }
    } catch (err) {
      toast.error('Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  };

  const loadChats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/chats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (response.ok) {
        setChats(result);
      }
    } catch (err) {
      toast.error('Ошибка загрузки чатов');
    } finally {
      setLoading(false);
    }
  }; 

  const handleApproveMedic = async (medicId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/medics/${medicId}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success('✅ Медик одобрен!');
        loadMedics();
      }
    } catch (err) {
      toast.error('Ошибка одобрения');
    }
  };

  const handleRejectMedic = async (medicId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/medics/${medicId}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success('❌ Медик отклонён');
        loadMedics();
      }
    } catch (err) {
      toast.error('Ошибка отклонения');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; class: string }> = {
      PENDING: { text: 'На проверке', class: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' },
      APPROVED: { text: 'Одобрен', class: 'bg-green-500/20 border-green-500/30 text-green-400' },
      REJECTED: { text: 'Отклонён', class: 'bg-red-500/20 border-red-500/30 text-red-400' },
    };
    return badges[status] || badges.PENDING;
  };

  // Открыть модальное окно с документами
// ✅ ИСПРАВЛЕНО: Открыть модальное окно с документами
const viewDocuments = async (medicId: number | string, medicName: string) => {
  setLoadingDocs(true);
  setShowDocsModal(true);
  
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('Необходима авторизация');
      router.push('/auth');
      return;
    }

    // ✅ ДЕЛАЕМ ТОЛЬКО ОДИН ЗАПРОС!
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/medics/${medicId}/documents`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        toast.error('Сессия истекла');
        router.push('/auth');
        return;
      }
      throw new Error('Ошибка загрузки документов');
    }

    const data = await res.json();
    
    console.log('📄 Documents response:', data); // ← Для отладки
    
    // ✅ ИСПОЛЬЗУЕМ ДАННЫЕ ИЗ ОДНОГО ЗАПРОСА!
    setSelectedMedicDocs({
      medicId,
      medicName,
      identityDocument: data.identityDocument || null, // ← Берём из первого запроса!
      documents: data.documents || [],
    });

  } catch (err: any) {
    console.error('❌ viewDocuments error:', err);
    toast.error(err.message || 'Ошибка загрузки документов');
    setShowDocsModal(false);
  } finally {
    setLoadingDocs(false);
  }
};

  const clearDocuments = async (medicId: number | string) => {
    if (!confirm('Удалить все документы этого медика?')) return;

    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/medics/${medicId}/clear-documents`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!res.ok) throw new Error('Ошибка удаления');

      toast.success('✅ Документы удалены');
      loadMedics();

    } catch (err: any) {
      console.error(err);
      toast.error('Ошибка удаления документов');
    }
  };

  const getComplaintStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      NEW: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
      IN_PROGRESS: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      RESOLVED: 'bg-green-500/20 border-green-500/30 text-green-400',
      REJECTED: 'bg-gray-500/20 border-gray-500/30 text-gray-400',
    };
    return badges[status] || badges.NEW;
  };

  const getComplaintStatusText = (status: string) => {
    const texts: Record<string, string> = {
      NEW: 'Новая',
      IN_PROGRESS: 'В работе',
      RESOLVED: 'Решена',
      REJECTED: 'Отклонена',
    };
    return texts[status] || status;
  };

  const updateComplaintStatus = async (complaintId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/complaints/${complaintId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка обновления статуса');
      }

      toast.success('✅ Статус обновлён');
      await loadComplaints();

    } catch (err: any) {
      toast.error(err.message || 'Ошибка обновления');
    }
  };

  // Группировка документов по типам
  const getGroupedDocuments = () => {
    if (!selectedMedicDocs) return { identity: null, certificates: [], license: null };
    
    const identity = selectedMedicDocs.identityDocument;
    const certificates = selectedMedicDocs.documents.filter((d: any) => d.type === 'CERTIFICATE');
    const license = selectedMedicDocs.documents.find((d: any) => d.type === 'LICENSE');
    
    return { identity, certificates, license };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-xl">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Админ панель</h1>
                <p className="text-sm text-slate-400">Управление платформой</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-2 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              onClick={() => setActiveTab('medics')}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                activeTab === 'medics'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg'
                  : 'hover:bg-white/10'
              }`}
            >
              <Users className="w-5 h-5 mx-auto mb-1" />
              <span className="text-sm">Медики</span>
            </button>
            
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg'
                  : 'hover:bg-white/10'
              }`}
            >
              <Package className="w-5 h-5 mx-auto mb-1" />
              <span className="text-sm">Заказы</span>
            </button>
            
            {/* ✅ НОВАЯ КНОПКА: ЧАТЫ */}
            <button
              onClick={() => setActiveTab('chats')}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                activeTab === 'chats'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg'
                  : 'hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-5 h-5 mx-auto mb-1" />
              <span className="text-sm">Чаты</span>
            </button>
            
            <button
              onClick={() => setActiveTab('complaints')}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                activeTab === 'complaints'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg'
                  : 'hover:bg-white/10'
              }`}
            >
              <AlertTriangle className="w-5 h-5 mx-auto mb-1" />
              <span className="text-sm">Жалобы</span>
            </button>
            
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                activeTab === 'stats'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg'
                  : 'hover:bg-white/10'
              }`}
            >
              <TrendingUp className="w-5 h-5 mx-auto mb-1" />
              <span className="text-sm">Статистика</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-12 h-12 animate-spin text-cyan-400" />
          </div>
        ) : (
          <>
            {/* Medics Tab */}
            {activeTab === 'medics' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Медики ({medics.length})</h2>
                </div>

                {medics.length === 0 ? (
                  <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-12 text-center">
                    <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">Нет медиков</p>
                  </div>
                ) : (
                  medics.map((medic: any) => {
                    const statusBadge = getStatusBadge(medic.status);
                    return (
                      <div
                        key={medic.id}
                        className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            {medic.avatar ? (
                              <img
                                src={medic.avatar}
                                alt={medic.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-cyan-500/30"
                              />
                            ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl font-bold">
                              {medic.name[0]}
                            </div>
                            )}
                            <div>
                              <div className="font-semibold text-lg">{medic.name}</div>
                              <div className="text-sm text-slate-400">{medic.phone}</div>
                              <div className="text-xs text-slate-500">ID: {medic.id}</div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.class}`}>
                            {statusBadge.text}
                          </span>
                        </div>

                        {/* ✅ РАСШИРЕННАЯ информация медика */}
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                          {/* Специализация */}
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Специализация</div>
                            <div className="font-medium">{medic.specialization || 'Не указана'}</div>
                          </div>
                          
                          {/* Опыт */}
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Опыт работы</div>
                            <div className="font-medium">{medic.experience || 0} лет</div>
                          </div>
                          
                          {/* Город */}
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Город</div>
                            <div className="font-medium">{medic.city || 'Не указан'}</div>
                          </div>
                          
                          {/* Районы */}
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Районы обслуживания</div>
                            <div className="font-medium text-sm">
                              {medic.areas && medic.areas.length > 0 
                                ? medic.areas.join(', ') 
                                : 'Не указаны'}
                            </div>
                          </div>
                          
                          {/* Рейтинг */}
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Рейтинг</div>
                            <div className="font-medium flex items-center">
                              {medic.ratingAvg > 0 ? (
                                <>
                                  <span className="text-yellow-400 text-lg">{medic.ratingAvg.toFixed(1)}</span>
                                  <span className="text-yellow-400 ml-1">⭐</span>
                                  <span className="text-slate-400 text-xs ml-2">
                                    ({medic.reviewsCount} отзывов)
                                  </span>
                                </>
                              ) : (
                                <span className="text-slate-500">Нет отзывов</span>
                              )}
                            </div>
                          </div>
                          
                          {/* ✅ НОВОЕ: Telegram статус */}
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Telegram бот</div>
                            <div className="font-medium">
                              {medic.telegramConnected ? (
                                <span className="text-green-400 flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Подключён
                                </span>
                              ) : (
                                <span className="text-slate-500 flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                  Не подключён
                                </span>
                              )}
                            </div>
                          </div>

                            <div>
                              <div className="text-xs text-slate-400 mb-1">Дата рождения</div>
                              <div className="font-medium">
                                {medic.birthDate 
                                  ? new Date(medic.birthDate).toLocaleDateString('ru-RU', {
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric'
                                    })
                                  : 'Не указана'}
                              </div>
                            </div>
                            
                            {/* ✅ НОВОЕ: Адрес проживания */}
                            <div>
                              <div className="text-xs text-slate-400 mb-1">Адрес проживания</div>
                              <div className="font-medium text-sm">
                                {medic.residenceAddress || 'Не указан'}
                              </div>
                            </div>
                          
                          {/* Образование */}
                          <div className="sm:col-span-2">
                            <div className="text-xs text-slate-400 mb-1">Образование</div>
                            <div className="font-medium text-sm text-slate-300">
                              {medic.education || 'Не указано'}
                            </div>
                          </div>
                        </div>

                          {/* ✅ НОВОЕ: Выполняемые процедуры */}
                          {medic.availableProcedures && medic.availableProcedures.length > 0 && (
                            <div className="sm:col-span-2">
                              <div className="text-xs text-slate-400 mb-2">Выполняемые процедуры</div>
                              <div className="flex flex-wrap gap-2">
                                {medic.availableProcedures.map((proc: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30"
                                  >
                                    <span className="text-lg">{getProcedureIcon(proc)}</span>
                                    <span className="text-xs text-cyan-400">{getProcedureName(proc)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Кнопка просмотра документов */}
                        <button
                          onClick={() => viewDocuments(medic.id, medic.name)}
                          className="w-full mb-3 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30 font-medium transition-all flex items-center justify-center"
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          📄 Просмотреть документы
                        </button>

                        {medic.status === 'PENDING' && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleApproveMedic(medic.id)}
                              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 font-semibold shadow-lg transition-all flex items-center justify-center"
                            >
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Одобрить
                            </button>
                            <button
                              onClick={() => handleRejectMedic(medic.id)}
                              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 font-semibold shadow-lg transition-all flex items-center justify-center"
                            >
                              <XCircle className="w-5 h-5 mr-2" />
                              Отклонить
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Все заказы ({orders.length})</h2>
                </div>

                {orders.length === 0 ? (
                  <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-12 text-center">
                    <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">Нет заказов</p>
                  </div>
                ) : (
                  orders.map((order: any) => (
                    <div
                      key={order.id}
                      className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="font-semibold text-lg">{order.serviceType}</div>
                          <div className="text-xs text-slate-400">#{order.id}</div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium border bg-cyan-500/20 border-cyan-500/30 text-cyan-400">
                          {order.status}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Клиент</div>
                          <div className="font-medium">{order.client?.name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Медик</div>
                          <div className="font-medium">{order.medic?.name || 'Не назначен'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Создан</div>
                          <div className="font-medium">{new Date(order.createdAt).toLocaleDateString('ru-RU')}</div>
                        </div>
                      </div>

                      {/* ✅ НОВОЕ: Процедуры в заказе */}
                      {order.procedures && order.procedures.length > 0 && (
                        <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                          <div className="text-xs text-purple-400 mb-2 font-medium">Процедуры:</div>
                          <div className="flex flex-wrap gap-2">
                            {order.procedures.map((proc: string, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10"
                              >
                                <span>{getProcedureIcon(proc)}</span>
                                <span className="text-xs">{getProcedureName(proc)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  ))
                )}
              </div>
            )}

            {/* Chats Tab */}
            {activeTab === 'chats' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Все чаты ({chats.length})</h2>
                </div>

                {chats.length === 0 ? (
                  <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-12 text-center">
                    <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">Нет активных чатов</p>
                  </div>
                ) : (
                  chats.map((chat: any) => (
                    <div
                      key={chat.orderId}
                      className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 hover:border-cyan-500/50 transition-all cursor-pointer"
                      onClick={() => router.push(`/admin/chats/${chat.orderId}`)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                            <MessageSquare className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-semibold text-lg">Заказ #{chat.orderId.slice(0, 8)}</div>
                            <div className="text-sm text-slate-400">{chat.serviceType}</div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border bg-cyan-500/20 border-cyan-500/30 text-cyan-400`}>
                          {chat.messagesCount} сообщений
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Клиент</div>
                          <div className="font-medium">{chat.clientName}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Медик</div>
                          <div className="font-medium">{chat.medicName || 'Не назначен'}</div>
                        </div>
                      </div>

                      {chat.lastMessage && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                          <div className="text-xs text-slate-400 mb-1">Последнее сообщение:</div>
                          <div className="text-sm text-slate-300 truncate">{chat.lastMessage}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {new Date(chat.lastMessageAt).toLocaleString('ru-RU')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Complaints Tab */}
            {activeTab === 'complaints' && (
              <div className="space-y-4">
                {/* Фильтры */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  <button
                    onClick={() => setComplaintFilter('ALL')}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                      complaintFilter === 'ALL' 
                        ? 'bg-cyan-500 shadow-lg' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Все
                  </button>
                  <button
                    onClick={() => setComplaintFilter('NEW')}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                      complaintFilter === 'NEW' 
                        ? 'bg-yellow-500 shadow-lg' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Новые
                  </button>
                  <button
                    onClick={() => setComplaintFilter('IN_PROGRESS')}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                      complaintFilter === 'IN_PROGRESS' 
                        ? 'bg-blue-500 shadow-lg' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    В работе
                  </button>
                  <button
                    onClick={() => setComplaintFilter('COMPLETED')}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                      complaintFilter === 'COMPLETED' 
                        ? 'bg-green-500 shadow-lg' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Завершённые
                  </button>
                </div>

                {complaints.length === 0 ? (
                  <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-12 text-center">
                    <AlertTriangle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">Нет жалоб</p>
                  </div>
                ) : (
                  complaints.map((complaint: any) => (
                    <div
                      key={complaint.id}
                      className="rounded-2xl bg-gradient-to-br from-red-500/10 to-pink-500/5 backdrop-blur-xl border border-red-500/30 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="font-semibold text-lg text-red-400">{complaint.complaintCategory}</div>
                          <div className="text-xs text-slate-400">Заказ #{complaint.orderId}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getComplaintStatusBadge(complaint.complaintStatus)}`}>
                          {getComplaintStatusText(complaint.complaintStatus)}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-slate-300">{complaint.complaintDescription}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <div className="text-xs text-slate-400">Клиент</div>
                          <div className="font-medium">{complaint.order.client.name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">Медик</div>
                          <div className="font-medium">
                            {complaint.order.medic?.name || 'Не назначен'}
                          </div>
                        </div>
                      </div>

                      {complaint.complaintStatus === 'NEW' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'IN_PROGRESS')}
                            className="flex-1 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 transition-all text-sm"
                          >
                            Взять в работу
                          </button>
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'RESOLVED')}
                            className="flex-1 py-2 rounded-xl bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 transition-all text-sm"
                          >
                            Решено
                          </button>
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'REJECTED')}
                            className="px-4 py-2 rounded-xl bg-gray-500/20 border border-gray-500/30 hover:bg-gray-500/30 transition-all text-sm"
                          >
                            Отклонить
                          </button>
                        </div>
                      )}

                      {complaint.complaintStatus === 'IN_PROGRESS' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'RESOLVED')}
                            className="flex-1 py-2 rounded-xl bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 transition-all text-sm"
                          >
                            Решено
                          </button>
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'REJECTED')}
                            className="px-4 py-2 rounded-xl bg-gray-500/20 border-gray-500/30 hover:bg-gray-500/30 transition-all text-sm"
                          >
                            Отклонить
                          </button>
                        </div>
                      )}

                      <div className="text-xs text-slate-500 mt-4">
                        {new Date(complaint.createdAt).toLocaleString('ru-RU')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && stats && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Общая статистика</h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
                    <div className="text-3xl font-bold text-cyan-400 mb-2">{stats.totalUsers || 0}</div>
                    <div className="text-sm text-slate-400">Всего пользователей</div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
                    <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalMedics || 0}</div>
                    <div className="text-sm text-slate-400">Медиков</div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
                    <div className="text-3xl font-bold text-green-400 mb-2">{stats.totalOrders || 0}</div>
                    <div className="text-sm text-slate-400">Всего заказов</div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
                    <div className="text-3xl font-bold text-purple-400 mb-2">{stats.totalReviews || 0}</div>
                    <div className="text-sm text-slate-400">Отзывов</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно с документами */}
      {showDocsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Документы медика</h2>
                <p className="text-sm text-slate-400">{selectedMedicDocs?.medicName}</p>
              </div>
              <button
                onClick={() => setShowDocsModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loadingDocs ? (
                <div className="flex items-center justify-center py-20">
                  <Loader className="w-12 h-12 animate-spin text-cyan-400" />
                </div>
              ) : (
                <>
                  {(() => {
                    const { identity, certificates, license } = getGroupedDocuments();
                    const hasDocuments = identity || certificates.length > 0 || license;

                    if (!hasDocuments) {
                      return (
                        <div className="text-center py-20">
                          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-400">Документы не загружены</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        {/* Удостоверение личности */}
                        {identity && (
                          <div>
                            <h3 className="text-lg font-bold mb-3 flex items-center">
                              <span className="mr-2">🪪</span>
                              Удостоверение личности
                            </h3>
                            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                              <a
                                href={identity.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={identity.url}
                                  alt="Удостоверение"
                                  className="w-full rounded-lg hover:opacity-80 transition"
                                />
                              </a>
                              <div className="mt-2 text-xs text-slate-400">
                                Загружено: {new Date(identity.uploadedAt).toLocaleString('ru-RU')}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Сертификаты/Дипломы */}
                        {certificates.length > 0 && (
                          <div>
                            <h3 className="text-lg font-bold mb-3 flex items-center">
                              <span className="mr-2">📜</span>
                              Сертификаты / Дипломы ({certificates.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {certificates.map((cert: any, index: number) => (
                                <div key={index} className="rounded-xl bg-white/5 border border-white/10 p-4">
                                  <a
                                    href={cert.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={cert.url}
                                      alt={`Сертификат ${index + 1}`}
                                      className="w-full rounded-lg hover:opacity-80 transition"
                                    />
                                  </a>
                                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                                    <span>Сертификат {index + 1}</span>
                                    <span>{new Date(cert.uploadedAt).toLocaleDateString('ru-RU')}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Лицензия */}
                        {license && (
                          <div>
                            <h3 className="text-lg font-bold mb-3 flex items-center">
                              <span className="mr-2">⚕️</span>
                              Медицинская лицензия
                              <span className="ml-2 text-xs text-slate-400">(необязательно)</span>
                            </h3>
                            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                              <a
                                href={license.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={license.url}
                                  alt="Лицензия"
                                  className="w-full rounded-lg hover:opacity-80 transition"
                                />
                              </a>
                              <div className="mt-2 text-xs text-slate-400">
                                Загружено: {new Date(license.uploadedAt).toLocaleString('ru-RU')}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-6">
              <button
                onClick={() => setShowDocsModal(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold transition-all"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}