'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function NotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Проверяем сохранённую настройку
    const saved = localStorage.getItem('notificationSoundEnabled');
    if (saved === 'true') {
      setSoundEnabled(true);
    }
  }, []);

  // Инициализация Audio Context
  const initAudio = () => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('✅ AudioContext initialized');
      } catch (error) {
        console.error('❌ Failed to create AudioContext:', error);
      }
    }
  };

  // Воспроизведение звука "динь"
  const playBeep = () => {
    if (!soundEnabled) {
      console.log('🔇 Sound disabled');
      return;
    }

    if (!audioContextRef.current) {
      console.log('⚠️ AudioContext not initialized');
      return;
    }

    try {
      const context = audioContextRef.current;
      
      // Проверяем что AudioContext активен
      if (context.state === 'suspended') {
        context.resume().then(() => {
          console.log('✅ AudioContext resumed');
          playTone(context);
        });
      } else {
        playTone(context);
      }
    } catch (error) {
      console.error('❌ Play sound error:', error);
    }
  };

  // Генерация тона
  const playTone = (context: AudioContext) => {
    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Настройки звука "динь"
      oscillator.type = 'sine';
      oscillator.frequency.value = 800; // Частота (Hz)
      
      // Плавное затухание
      gainNode.gain.setValueAtTime(0.3, context.currentTime); // Начальная громкость
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.3);
      
      console.log('🔔 Sound played');
    } catch (error) {
      console.error('❌ Play tone error:', error);
    }
  };

  // Переключение звука
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notificationSoundEnabled', newValue.toString());
    
    if (newValue) {
      // Инициализируем AudioContext
      initAudio();
      
      // Воспроизводим тестовый звук через 100мс
      setTimeout(() => {
        playBeep();
      }, 100);
    } else {
      // Отключаем AudioContext
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        console.log('🔇 AudioContext closed');
      }
    }
  };

  // Экспортируем функцию глобально
  useEffect(() => {
    if (mounted) {
      (window as any).playNotificationSound = playBeep;
      console.log('✅ playNotificationSound registered');
    }
    
    return () => {
      // Cleanup при размонтировании
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [soundEnabled, mounted]);

  if (!mounted) return null;

  return (
    <button
      onClick={toggleSound}
      className={`fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all hover:scale-110 ${
        soundEnabled 
          ? 'bg-green-500 hover:bg-green-400 shadow-green-500/50' 
          : 'bg-slate-700 hover:bg-slate-600'
      }`}
      title={soundEnabled ? 'Звук включён (нажмите для выключения)' : 'Звук выключен (нажмите для включения)'}
    >
      {soundEnabled ? (
        <Volume2 className="w-6 h-6 text-white" />
      ) : (
        <VolumeX className="w-6 h-6 text-slate-400" />
      )}
    </button>
  );
}