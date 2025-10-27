"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Users, Package, AlertTriangle, TrendingUp, CheckCircle, XCircle, Eye, Loader, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('medics');
  const [medics, setMedics] = useState([]);
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = () => {
    if (activeTab === 'medics') {
      loadMedics();
    } else if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'complaints') {
      loadComplaints();
    } else if (activeTab === 'stats') {
      loadStats();
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/complaints`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

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

  // Функция просмотра документов
  const viewDocuments = async (medicId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/medics/${medicId}/documents`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await res.json();
      
      // Проверяем, что documents существует и это массив
      if (!data.documents || !Array.isArray(data.documents) || data.documents.length === 0) {
        toast.error('Документы не загружены');
        return;
      }

      // Открываем документы в новых вкладках
      data.documents.forEach((doc: { url: string; type: string }) => {
        window.open(doc.url, '_blank');
      });

      toast.success(`Открыто документов: ${data.documents.length}`);

    } catch (err) {
      console.error(err);
      toast.error('Ошибка загрузки документов');
    }
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl font-bold">
                              {medic.name[0]}
                            </div>
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

                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Специализация</div>
                            <div className="font-medium">{medic.specialization || 'Не указана'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Опыт</div>
                            <div className="font-medium">{medic.experience || 'Не указан'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Образование</div>
                            <div className="font-medium text-sm">{medic.education || 'Не указано'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Районы</div>
                            <div className="font-medium text-sm">{medic.areas?.join(', ') || 'Не указаны'}</div>
                          </div>
                        </div>

                        {/* Кнопка просмотра документов */}
                        <div className="mb-3">
                          <button
                            onClick={() => viewDocuments(medic.id)}
                            className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30 font-medium text-sm transition-all flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            📄 Просмотреть документы
                          </button>
                        </div>

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
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Complaints Tab */}
            {activeTab === 'complaints' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Жалобы ({complaints.length})</h2>
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
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-slate-300">{complaint.complaintDescription}</div>
                      </div>

                      <div className="text-xs text-slate-500">
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
    </div>
  );
}