"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, ShoppingCart, MessageSquare, User, Menu, X, Heart, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navigation() {
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('👋 До встречи!');
    setTimeout(() => {
      router.push('/auth');
    }, 500);
  };

  if (!user) return null;

  const links = {
    CLIENT: [
      { icon: Home, label: 'Главная', href: '/' },
      { icon: ShoppingCart, label: 'Создать заказ', href: '/orders/create' },
      { icon: User, label: 'Мои заказы', href: '/client/orders' },
    ],
    MEDIC: [
      { icon: Home, label: 'Dashboard', href: '/medic/dashboard' },
      { icon: User, label: 'Профиль', href: '/medic/profile' },
    ],
    ADMIN: [
      { icon: Home, label: 'Админка', href: '/admin' },
    ],
  };

  const userLinks = links[user.role as keyof typeof links] || [];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">MedicPro</span>
            </div>

            {/* Links */}
            <div className="flex items-center space-x-2">
              {userLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.href}
                    onClick={() => router.push(link.href)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </button>
                );
              })}

              {/* User Info */}
              <div className="ml-4 flex items-center space-x-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-white text-sm">
                  {user.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{user.name}</div>
                  <div className="text-xs text-slate-400">
                    {user.role === 'CLIENT' && 'Клиент'}
                    {user.role === 'MEDIC' && 'Медик'}
                    {user.role === 'ADMIN' && 'Админ'}
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                title="Выйти"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl bg-slate-900/80">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2" onClick={() => router.push('/')}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">MedicPro</span>
            </div>

            {/* Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-all"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-slate-900/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-2">
              {userLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.href}
                    onClick={() => {
                      router.push(link.href);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </button>
                );
              })}

              {/* User Info */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-white">
                    {user.name[0]}
                  </div>
                  <div>
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-sm text-slate-400">{user.phone}</div>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer */}
      <div className="h-16"></div>
    </>
  );
}