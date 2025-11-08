import './globals.css';
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
        
        {/* Глобальный слушатель уведомлений - БЕЗ Toaster! */}
        <NotificationListener />
      </body>
    </html>
  );
}