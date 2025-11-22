'use client';

import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Проверяем, давал ли пользователь согласие
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-slide-up">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
      
      {/* Banner */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border-t border-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icon */}
            <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex-shrink-0">
              <Cookie className="w-6 h-6 text-cyan-400" />
            </div>

            {/* Text */}
            <div className="flex-1">
              <p className="text-white text-sm md:text-base mb-1">
                🍪 <span className="font-semibold">Мы используем cookies</span>
              </p>
              <p className="text-slate-300 text-xs md:text-sm">
                Для улучшения работы сайта и предоставления персонализированного опыта. Продолжая использовать сайт, вы соглашаетесь с нашей{' '}
                <button className="text-cyan-400 hover:text-cyan-300 underline">
                  политикой конфиденциальности
                </button>
                .
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleAccept}
                className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/30 transition-all"
              >
                Принять
              </button>
              <button
                onClick={handleAccept}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors md:hidden"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}