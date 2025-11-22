'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';

export default function NotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    // Проверяем сохранённую настройку
    const saved = localStorage.getItem('notificationSoundEnabled');
    if (saved === 'true') {
      setSoundEnabled(true);
      initAudio();
    }
  }, []);

  const initAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/notification.mp3');
      audioRef.current.volume = 0.5;
    }
  };

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error('Failed to play notification sound:', err);
      });
    }
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notificationSoundEnabled', newValue.toString());
    
    if (newValue) {
      initAudio();
      // Тестовый звук
      setTimeout(() => playSound(), 100);
    }
  };

  useEffect(() => {
    (window as any).playNotificationSound = playSound;
  }, [soundEnabled]);

  return (
    <button
      onClick={toggleSound}
      className={`fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all ${
        soundEnabled 
          ? 'bg-green-500 hover:bg-green-400' 
          : 'bg-slate-700 hover:bg-slate-600'
      }`}
      title={soundEnabled ? 'Звук включён' : 'Звук выключен'}
    >
      <Volume2 className={`w-6 h-6 ${soundEnabled ? 'text-white' : 'text-slate-400'}`} />
    </button>
  );
}