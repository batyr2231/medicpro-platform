import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ru from './locales/ru.json';
import kz from './locales/kz.json';

const resources = {
  ru: { translation: ru },
  kz: { translation: kz }
};

i18n
  .use(LanguageDetector) // Автоопределение языка браузера
  .use(initReactI18next) // Интеграция с React
  .init({
    resources,
    fallbackLng: 'ru', // Язык по умолчанию
    lng: 'ru', // Начальный язык
    debug: false, // Включи true для отладки
    
    interpolation: {
      escapeValue: false // React уже защищает от XSS
    },
    
    detection: {
      order: ['localStorage', 'navigator'], // Порядок определения языка
      caches: ['localStorage'] // Сохранять выбранный язык
    }
  });

export default i18n;
