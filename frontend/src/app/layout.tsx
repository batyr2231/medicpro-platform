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
        />
        
        {/* Глобальный слушатель уведомлений */}
        <NotificationListener />
      </body>
    </html>
  );
}