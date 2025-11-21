import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Публичные страницы (не требуют авторизации)
  const publicPaths = [
    '/', 
    '/auth',
    '/auth/register',
    '/auth/login',
    '/auth/forgot-password',
    '/health',
    '/_next',
    '/favicon.ico',
  ];

  // Проверяем, является ли путь публичным
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Если страница публичная - пропускаем
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Если нет токена - редирект на /auth
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('redirect', pathname); // Сохраняем куда хотел попасть
    return NextResponse.redirect(url);
  }

  // Если токен есть - пропускаем
  return NextResponse.next();
}

// Применяем middleware ко всем путям кроме статики
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};