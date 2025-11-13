import React from 'react';

export default function MedicProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      {/* Статус бейдж */}
      <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-white/10"></div>
        <div className="flex-1">
          <div className="h-5 bg-white/10 rounded w-48 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-64"></div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Личная информация */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
          <div className="flex items-center mb-6">
            <div className="w-6 h-6 bg-white/20 rounded mr-2"></div>
            <div className="h-6 bg-white/20 rounded w-48"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
                <div className="h-12 bg-white/5 border border-white/10 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Профессиональная информация */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
          <div className="flex items-center mb-6">
            <div className="w-6 h-6 bg-white/20 rounded mr-2"></div>
            <div className="h-6 bg-white/20 rounded w-56"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
                <div className="h-12 bg-white/5 border border-white/10 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Город */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
          <div className="flex items-center mb-6">
            <div className="w-6 h-6 bg-white/20 rounded mr-2"></div>
            <div className="h-6 bg-white/20 rounded w-36"></div>
          </div>
          <div className="h-12 bg-white/5 border border-white/10 rounded-xl"></div>
        </div>

        {/* Районы */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
          <div className="flex items-center mb-6">
            <div className="w-6 h-6 bg-white/20 rounded mr-2"></div>
            <div className="h-6 bg-white/20 rounded w-48"></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-20 bg-white/5 border border-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>

        {/* Кнопка сохранения */}
        <div className="h-14 bg-white/10 rounded-xl"></div>
      </div>
    </div>
  );
}