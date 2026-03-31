import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 'donerci_auth' isimli bir cookie var mı kontrol ediyoruz
  const hasAuth = request.cookies.has('donerci_auth');
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Eğer yetki yoksa ve login sayfasında değilsek -> Login'e yönlendir
  if (!hasAuth && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Eğer zaten giriş yapılmışsa ve login sayfasındaysa -> Ana sayfaya yönlendir
  if (hasAuth && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Hangi yollarda bu middleware'in çalışacağını belirliyoruz
// (Statik dosyalar, imajlar vb. hariç tüm sayfalarda çalışacak)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)'],
};
