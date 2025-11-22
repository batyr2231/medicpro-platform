import './globals.css';
import { Toaster } from 'react-hot-toast';
import NotificationListener from '@/components/NotificationListener';
import CookieConsent from '@/components/CookieConsent';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        {children}
        
        {/* Beautiful Toast Container */}
        <Toaster 
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              backdropFilter: 'blur(12px)',
              padding: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              maxWidth: '500px',
            },
            success: {
              duration: 3000,
              style: {
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#fff',
              },
              iconTheme: {
                primary: '#06b6d4',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fff',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
            loading: {
              style: {
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#fff',
              },
              iconTheme: {
                primary: '#a855f7',
                secondary: '#fff',
              },
            },
          }}
        />
        <CookieConsent />
        {/* Глобальный слушатель уведомлений */}
        <NotificationListener />
      </body>
    </html>
  );
}