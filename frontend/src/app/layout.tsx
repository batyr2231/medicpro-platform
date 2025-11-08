import './globals.css';
import { Toaster } from 'react-hot-toast';
import NotificationListener from '@/components/NotificationListener';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        {children}
        
        {/* Toast Container */}
        <Toaster 
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 5000,
            style: {
              background: '#1e293b',
              color: '#fff',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        />
        
        {/* Глобальный слушатель уведомлений */}
        <NotificationListener />
      </body>
    </html>
  );
}