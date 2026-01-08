"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Star, Award, Briefcase, Users, Loader, Filter } from 'lucide-react';
import { getCities, getDistricts } from 'utils/cities';
import ProcedureSelector from '@/components/ProcedureSelector';
import ProcedureList from '@/components/ProcedureList';

const SPECIALIZATIONS = [
  'Медсестра',
  'Терапевт',
  'Педиатр',
  'Врач общей практики'
];

export default function MedicsCatalogPage() {
  const router = useRouter();
  const [medics, setMedics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [proceduresFilter, setProceduresFilter] = useState<string[]>([]);

  useEffect(() => {
    loadMedics();
  }, [cityFilter, districtFilter, specializationFilter]);

  const loadMedics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (cityFilter) params.append('city', cityFilter);
      if (districtFilter) params.append('district', districtFilter);
      if (specializationFilter) params.append('specialization', specializationFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (proceduresFilter.length > 0) {
        proceduresFilter.forEach(proc => params.append('procedures', proc));
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/medics?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      setMedics(data);
    } catch (err) {
      console.error('Failed to load medics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadMedics();
  };

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '1.5em 1.5em',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">🩺 Каталог медиков</h1>
            <button
              onClick={() => router.push('/client/orders')}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              Мои заказы
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Поиск и фильтры */}
        <div className="mb-8 space-y-4">
          {/* Строка поиска */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Поиск по имени или специализации..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-400"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold transition-all"
            >
              Найти
            </button>
          </div>

          {/* Фильтры */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setDistrictFilter('');
              }}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white appearance-none cursor-pointer"
              style={selectStyle}
            >
              <option value="" className="bg-slate-900 text-white">Все города</option>
              {getCities().map(city => (
                <option key={city} value={city} className="bg-slate-900 text-white py-2">
                  {city}
                </option>
              ))}
            </select>

            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              disabled={!cityFilter}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={selectStyle}
            >
              <option value="" className="bg-slate-900 text-white">
                {cityFilter ? 'Все районы' : 'Сначала выберите город'}
              </option>
              {cityFilter && getDistricts(cityFilter).map(district => (
                <option key={district} value={district} className="bg-slate-900 text-white py-2">
                  {district}
                </option>
              ))}
            </select>

            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white appearance-none cursor-pointer"
              style={selectStyle}
            >
              <option value="" className="bg-slate-900 text-white">Все специализации</option>
              {SPECIALIZATIONS.map(spec => (
                <option key={spec} value={spec} className="bg-slate-900 text-white py-2">
                  {spec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Фильтр по процедурам */}
          <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <span className="text-lg mr-2">💊</span>
              Фильтр по процедурам
            </h3>
            <ProcedureSelector
              selectedProcedures={proceduresFilter}
              onChange={(procedures) => {
                setProceduresFilter(procedures);
                loadMedics();
              }}
              required={false}
            />
            {proceduresFilter.length > 0 && (
              <button
                onClick={() => {
                  setProceduresFilter([]);
                  loadMedics();
                }}
                className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                ✕ Сбросить фильтр процедур
              </button>
            )}
          </div>

        {/* Список медиков */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-12 h-12 text-cyan-500 animate-spin" />
          </div>
        ) : medics.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-slate-400 text-lg mb-2">Медики не найдены</p>
            <p className="text-slate-500 text-sm">Попробуйте изменить фильтры поиска</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medics.map((medic) => (
              <div
                key={medic.id}
                onClick={() => router.push(`/client/medics/${medic.id}`)}
                className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 hover:border-cyan-500/50 transition-all cursor-pointer group"
              >
                {/* Аватар */}
                <div className="flex items-start justify-between mb-4">
                  {medic.avatar ? (
                    <img
                      src={medic.avatar}
                      alt={medic.name}
                      className="w-16 h-16 rounded-full object-cover border-4 border-cyan-500/30 shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl font-bold shadow-lg">
                      {medic.name[0]}
                    </div>
                  )}
                  <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">{medic.avgRating || '5.0'}</span>
                  </div>
                </div>

                {/* Имя и специализация */}
                <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">
                  {medic.name}
                </h3>
                <p className="text-cyan-400 text-sm mb-3">{medic.specialization}</p>

                {/* Локация */}
                <div className="flex items-center space-x-2 text-sm text-slate-400 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{medic.city}{medic.district ? `, ${medic.district}` : ''}</span>
                </div>

                {/* Статистика */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center space-x-2 mb-1">
                      <Briefcase className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-slate-400">Опыт</span>
                    </div>
                    <div className="text-lg font-bold">{medic.experience} лет</div>
                  </div>

                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center space-x-2 mb-1">
                      <Users className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-slate-400">Отзывы</span>
                    </div>
                    <div className="text-lg font-bold">{medic.reviewCount || 0}</div>
                  </div>
                </div>
                { /* Процедуры */}
                {medic.availableProcedures && medic.availableProcedures.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-xs text-slate-400 mb-2">Выполняет процедуры:</div>
                    <ProcedureList procedures={medic.availableProcedures} compact={true} />
                  </div>
                )}
                {/* Кнопка */}    
                <button
                  className="w-full mt-4 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 font-semibold transition-all"
                >
                  Посмотреть профиль
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}