'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function NotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // ✅ ИСПРАВЛЕНИЕ 1: Загружаем настройку ОДИН раз при монтировании
  useEffect(() => {
    setIsClient(true);
    
    const saved = localStorage.getItem('notificationSoundEnabled');
    const enabled = saved === 'true';
    
    console.log('🔊 Initial sound state:', enabled);
    setSoundEnabled(enabled);
    
    // Если звук включён - инициализируем AudioContext
    if (enabled) {
      initAudio();
    }
  }, []); // ← Пустой массив = выполняется ОДИН раз!

  // Инициализация Audio Context
  const initAudio = () => {
    if (audioContextRef.current) {
      console.log('⚠️ AudioContext already exists');
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      console.log('✅ AudioContext initialized');
    } catch (error) {
      console.error('❌ Failed to create AudioContext:', error);
    }
  };

  // Воспроизведение звука
  const playBeep = () => {
    console.log('🎵 playBeep called, soundEnabled:', soundEnabled);

    if (!soundEnabled) {
      console.log('🔇 Sound is disabled');
      return;
    }

    if (!audioContextRef.current) {
      console.log('⚠️ AudioContext not initialized, initializing now...');
      initAudio();
      
      // Попробуем ещё раз через 50мс
      setTimeout(() => playBeep(), 50);
      return;
    }

    try {
      const context = audioContextRef.current;
      
      // Проверяем состояние AudioContext
      if (context.state === 'suspended') {
        console.log('⏸️ AudioContext suspended, resuming...');
        context.resume().then(() => {
          console.log('▶️ AudioContext resumed');
          playTone(context);
        });
      } else if (context.state === 'running') {
        playTone(context);
      } else {
        console.error('❌ AudioContext in unexpected state:', context.state);
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
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      
      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.3);
      
      console.log('🔔 Sound played successfully');
    } catch (error) {
      console.error('❌ Play tone error:', error);
    }
  };

  // Переключение звука
  const toggleSound = () => {
    const newValue = !soundEnabled;
    console.log('🔄 Toggling sound:', soundEnabled, '→', newValue);
    
    setSoundEnabled(newValue);
    localStorage.setItem('notificationSoundEnabled', newValue.toString());
    
    if (newValue) {
      // Включаем звук
      initAudio();
      
      // Тестовый звук через 200мс
      setTimeout(() => {
        console.log('🧪 Playing test sound...');
        playBeep();
      }, 200);
    } else {
      // Выключаем звук
      console.log('🔇 Sound disabled by user');
      
      // НЕ закрываем AudioContext! Просто отключаем флаг
      // Это позволит быстро включить звук снова
    }
  };

  // ✅ ИСПРАВЛЕНИЕ 2: Регистрируем функцию при КАЖДОМ изменении soundEnabled
  useEffect(() => {
    if (!isClient) return;

    // Создаём функцию которая всегда имеет доступ к актуальному soundEnabled
    const playFunction = () => {
      playBeep();
    };

    (window as any).playNotificationSound = playFunction;
    console.log('✅ playNotificationSound registered, soundEnabled:', soundEnabled);

    // Cleanup
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
        console.log('🧹 AudioContext closed');
      }
    };
  }, [soundEnabled, isClient]);

  if (!isClient) return null;

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