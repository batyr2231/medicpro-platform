"use client";

import React, { useState } from 'react';
import { MapPin, Calendar, Clock, FileText, Heart, ChevronRight, ArrowLeft } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useRouter } from 'next/navigation';

export default function CreateOrderPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: '',
    city: 'Алматы',
    district: '',
    address: '',
    date: '',
    time: '',
    comment: '',
    price: '',
  });

  const { createOrder, loading: orderLoading, error: orderError } = useOrders();
  const router = useRouter();

  const services = [
    { id: 'Медсестра на дом', name: '💉 Медсестра на дом', desc: 'Капельницы, уколы, перевязки' },
    { id: 'Врач общей практики', name: '🩺 Врач общей практики', desc: 'Консультация, диагностика' },
    { id: 'Кардиолог', name: '❤️ Кардиолог', desc: 'Проблемы с сердцем' },
    { id: 'Невролог', name: '🧠 Невролог', desc: 'Нервная система' },
    { id: 'Педиатр', name: '👶 Педиатр', desc: 'Детский врач' },
    { id: 'Терапевт', name: '🏥 Терапевт', desc: 'Общие заболевания' },
  ]

  const districts = [
    'Алмалинский', 'Ауэзовский', 'Бостандыкский', 'Жетысуский',
    'Медеуский', 'Наурызбайский', 'Турксибский', 'Алатауский'
  ];

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const scheduledDateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
      
      const result = await createOrder({
        serviceType: services.find(s => s.id === formData.serviceType)?.name || formData.serviceType,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        scheduledTime: scheduledDateTime,
        comment: formData.comment,
        price: formData.price ? parseInt(formData.price) : undefined, 
      });

      console.log('Order created:', result);
      
      // Редиректим на детальную страницу заказа
      router.push(`/client/orders/${result.id}`);
      
    } catch (err) {
      console.error('Create order error:', err);
      alert('❌ Ошибка создания заказа');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад</span>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">MedicPro</span>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step >= s 
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/50' 
                  : 'bg-white/10 text-slate-400'
              }`}>
                {s}
              </div>
              {s < 3 && (
                <div className={`w-16 sm:w-24 h-1 mx-2 rounded transition-all ${
                  step > s ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-white/10'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        <div>
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="space-y-6 animate-slide-in">
              <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold">Выберите услугу</h1>
                <p className="text-slate-400">Какой специалист вам нужен?</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleChange('serviceType', service.id)}
                    className={`p-6 rounded-2xl text-left transition-all ${
                      formData.serviceType === service.id
                        ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500 shadow-lg shadow-cyan-500/20'
                        : 'bg-white/5 border-2 border-white/10 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl mb-2">{service.name.split(' ')[0]}</div>
                    <div className="font-semibold mb-1 text-white">
                      {service.name.substring(service.name.indexOf(' ') + 1)}
                    </div>
                    <div className="text-sm text-slate-400">{service.desc}</div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => formData.serviceType && setStep(2)}
                  disabled={!formData.serviceType}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center"
                >
                  Далее
                  <ChevronRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Location & Time */}
          {step === 2 && (
            <div className="space-y-6 animate-slide-in">
              <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold">Адрес и время</h1>
                <p className="text-slate-400">Когда и куда приехать медику?</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-5">
                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Район города
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => handleChange('district', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white transition-colors"
                    required
                  >
                    <option value="" className="bg-slate-900">Выберите район</option>
                    {districts.map((d) => (
                      <option key={d} value={d} className="bg-slate-900">{d}</option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Полный адрес
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="ул. Абая 150, кв. 25"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors"
                    required
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Дата
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white transition-colors"
                    required
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Время
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleChange('time', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white transition-colors"
                    required
                  />
                </div>
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                    💰 Предполагаемая цена (тг)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder="Например: 5000"
                    min="0"
                    step="100"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    * Необязательно. Окончательная цена будет согласована с медиком
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4 max-w-2xl mx-auto">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold transition-all"
                >
                  Назад
                </button>
                <button
                  type="button"
                  onClick={() => formData.district && formData.address && formData.date && formData.time && setStep(3)}
                  disabled={!formData.district || !formData.address || !formData.date || !formData.time}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center"
                >
                  Далее
                  <ChevronRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Comment & Confirmation */}
          {step === 3 && (
            <div className="space-y-6 animate-slide-in">
              <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold">Подтверждение</h1>
                <p className="text-slate-400">Проверьте данные заказа</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                {/* Summary Card */}
                <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Услуга</div>
                      <div className="font-semibold">
                        {services.find(s => s.id === formData.serviceType)?.name}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-cyan-400 hover:text-cyan-300 text-sm"
                    >
                      Изменить
                    </button>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <div className="text-sm text-slate-400 mb-2">Адрес</div>
                    <div className="font-medium">
                      {formData.district}, {formData.address}
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Дата и время</div>
                      <div className="font-medium">
                        {new Date(formData.date).toLocaleDateString('ru-RU')} в {formData.time}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-cyan-400 hover:text-cyan-300 text-sm"
                    >
                      Изменить
                    </button>
                  </div>
                  {formData.price && (
                    <div className="border-t border-white/10 pt-4">
                      <div className="text-sm text-slate-400 mb-1">Предполагаемая цена</div>
                      <div className="font-medium text-green-400">
                        {parseInt(formData.price).toLocaleString('ru-RU')} тг
                      </div>
                    </div>
                  )}
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Комментарий (необязательно)
                  </label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => handleChange('comment', e.target.value)}
                    placeholder="Укажите дополнительную информацию: подъезд, этаж, код домофона..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-500 transition-colors resize-none"
                  ></textarea>
                </div>

                {/* Info Block */}
                <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="text-sm">
                      <div className="font-semibold text-cyan-400 mb-1">Как это работает?</div>
                      <div className="text-slate-300">
                        После создания заказа медики в вашем районе получат уведомление. 
                        Первый откликнувшийся примет заказ, и вы сможете с ним связаться в чате.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-sm text-slate-400 mb-2">💳 Оплата</div>
                  <div className="text-slate-300">
                    Оплата производится напрямую медику при визите. 
                    Стоимость услуги будет согласована с медиком после принятия заказа.
                  </div>
                </div>

                {/* Error */}
                {orderError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    ❌ {orderError}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-4 max-w-2xl mx-auto">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold transition-all"
                >
                  Назад
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={orderLoading}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
                >
                  {orderLoading ? 'Создаём...' : 'Создать заказ'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}