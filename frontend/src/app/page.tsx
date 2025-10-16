"use client";

import React, { useEffect } from 'react';
import { Heart, Clock, Shield, Star, ChevronRight, Menu, X, User, Stethoscope } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MedicPlatformLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const router = useRouter();

  /*
  // Проверяем авторизацию
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      // Если уже залогинен, редиректим на соответствующую страницу
      if (userData.role === 'CLIENT') {
        router.push('/orders/create');
      } else if (userData.role === 'MEDIC') {
        router.push('/medic/dashboard');
      } else if (userData.role === 'ADMIN') {
        router.push('/admin');
      }
    }
  }, [router]);
*/
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50 transform hover:scale-105 transition-transform">
                <Heart className="w-7 h-7" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                MedicPro
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => router.push('/auth')}
                className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all font-semibold"
              >
                Войти
              </button>
              <button
                onClick={() => router.push('/auth')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all font-semibold shadow-lg shadow-blue-500/30"
              >
                Стать медиком
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-2">
              <button
                onClick={() => {
                  router.push('/auth');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all font-semibold text-center"
              >
                Войти
              </button>
              <button
                onClick={() => {
                  router.push('/auth');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all font-semibold shadow-lg text-center"
              >
                Стать медиком
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-slide-in">
            <div className="inline-block px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
              <span className="text-cyan-400 text-sm font-semibold">🏥 Медицина нового поколения</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              Медицинская помощь{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                на дом
              </span>
            </h1>

            <p className="text-xl text-slate-300 leading-relaxed">
              Профессиональные медики приедут к вам за 15 минут. Без очередей, без стресса — просто качественная медицинская помощь.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/auth')}
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold shadow-2xl shadow-blue-500/50 transition-all hover:scale-105 flex items-center justify-center"
              >
                Вызвать медика
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => router.push('/auth')}
                className="px-8 py-4 rounded-xl border-2 border-white/20 hover:bg-white/10 font-semibold backdrop-blur-sm transition-all hover:scale-105"
              >
                Стать медиком
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400 mb-2">500+</div>
                <div className="text-sm text-slate-400">Медиков</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400 mb-2">15 мин</div>
                <div className="text-sm text-slate-400">Отклик</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400 mb-2">4.9★</div>
                <div className="text-sm text-slate-400">Рейтинг</div>
              </div>
            </div>
          </div>

          {/* Right Content - Floating Card */}
          <div className="relative hidden lg:block animate-slide-in" style={{animationDelay: '0.2s'}}>
            <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 shadow-2xl hover:scale-105 transition-transform duration-500">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl">
                  👨‍⚕️
                </div>
                <div>
                  <div className="font-semibold text-lg">Доктор Айболит</div>
                  <div className="text-sm text-slate-400">Терапевт • ⭐ 4.9</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <span className="text-slate-300">Опыт</span>
                  <span className="font-semibold">12 лет</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <span className="text-slate-300">Визитов</span>
                  <span className="font-semibold">1,200+</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <span className="text-slate-300">Доступность</span>
                  <span className="text-green-400 font-semibold flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                    Онлайн
                  </span>
                </div>
              </div>

              <button className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 font-semibold shadow-lg transition-all">
                Вызвать сейчас
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Почему выбирают нас?</h2>
          <p className="text-xl text-slate-400">Современная медицина у вас дома</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Clock className="w-8 h-8" />,
              title: 'Быстро',
              description: 'Медик приедет в течение 15 минут после заказа'
            },
            {
              icon: <Shield className="w-8 h-8" />,
              title: 'Надежно',
              description: 'Все медики проверены и сертифицированы'
            },
            {
              icon: <Star className="w-8 h-8" />,
              title: 'Качественно',
              description: 'Средний рейтинг наших специалистов 4.9/5'
            },
            {
              icon: <Heart className="w-8 h-8" />,
              title: 'Удобно',
              description: 'Оплата после визита, никаких предоплат'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 hover:border-cyan-500/50 transition-all hover:scale-105 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-3xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-xl border border-white/20 p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Готовы получить помощь?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Создайте заказ прямо сейчас — это займет меньше минуты
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="px-10 py-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold text-lg shadow-2xl shadow-blue-500/50 transition-all hover:scale-105 inline-flex items-center"
          >
            Начать
            <ChevronRight className="ml-2 w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 backdrop-blur-xl mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold">MedicPro</span>
            </div>
            <div className="text-slate-400 text-sm">
              © 2025 MedicPro. Все права защищены.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}