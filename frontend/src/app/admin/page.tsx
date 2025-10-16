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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-lg">Админ панель</div>
                <div className="text-xs text-slate-400">MedicPro</div>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                toast.success('👋 Выход выполнен');
                setTimeout(() => router.push('/auth'), 500);
              }}
              className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('medics')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'medics'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Медики</span>
          </button>
          
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Заказы</span>
          </button>
          
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'complaints'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Жалобы</span>
          </button>
          
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Статистика</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <Loader className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
            <div className="text-slate-400">Загрузка...</div>
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
                  medics.map((medic) => {
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
                              <div className="text-xs text-slate-500">ID: {medic.id.substring(0, 8)}</div>
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
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="font-semibold text-lg">{order.serviceType}</div>
                          <div className="text-xs text-slate-400">#{order.id.substring(0, 8)}</div>
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
                  complaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="rounded-2xl bg-gradient-to-br from-red-500/10 to-pink-500/5 backdrop-blur-xl border border-red-500/30 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="font-semibold text-lg text-red-400">{complaint.complaintCategory}</div>
                          <div className="text-xs text-slate-400">Заказ #{complaint.orderId.substring(0, 8)}</div>
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