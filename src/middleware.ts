// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

type Role = 'customer' | 'provider' | 'admin';

interface DecodedToken {
  userId?: string;
  email?: string;
  role?: Role;
  activeRole?: Role;
  roles?: Role[];
  providerStatus?: 'pending' | 'verified' | 'rejected' | 'suspended'; // [BARU]
  exp: number;
}

// Routes yang tidak butuh login
const PUBLIC_ROUTES = [
  '/login',
  '/register',
];

// Routes khusus Mitra (Harus Verified)
const PROVIDER_ROUTES = ['/dashboard', '/jobs', '/messages', '/settings', '/earnings'];

// Routes Status Pendaftaran (Pending/Rejected)
const VERIFICATION_ROUTE = '/become-partner'; // Kita gunakan halaman onboarding/status sebagai satu halaman yang sama

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

function isProviderRoute(pathname: string): boolean {
  return PROVIDER_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

function getTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get('posko_token')?.value || null;
}

function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip static files & API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = getTokenFromCookies(request);
  const user = token ? decodeToken(token) : null;

  // Cek peran user
  const hasProviderRole = 
    user?.activeRole === 'provider' || 
    user?.role === 'provider' || 
    (user?.roles && user.roles.includes('provider'));

  // Cek status verifikasi mitra
  const isVerifiedProvider = hasProviderRole && user?.providerStatus === 'verified';

  // 1. Jika User belum login dan akses halaman non-public -> Lempar ke Login
  if (!user && !isPublicRoute(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Jika User sudah login tapi akses halaman Login/Register
  if (user && isPublicRoute(pathname)) {
    if (isVerifiedProvider) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 3. Proteksi Halaman Provider (Dashboard, Jobs, dll)
  if (isProviderRoute(pathname)) {
    // Jika bukan provider sama sekali -> Ke halaman onboarding
    if (!hasProviderRole) {
      const onboardingUrl = new URL('/become-partner', request.url);
      return NextResponse.redirect(onboardingUrl);
    }

    // Jika Provider tapi belum verified (Pending/Rejected/Suspended) -> Ke halaman status
    if (!isVerifiedProvider) {
      const verificationUrl = new URL(VERIFICATION_ROUTE, request.url);
      return NextResponse.redirect(verificationUrl);
    }
  }

  // 4. Proteksi Halaman Onboarding / Verifikasi (/become-partner)
  if (pathname === VERIFICATION_ROUTE) {
    // Jika user SUDAH verified, tidak perlu melihat halaman status lagi, langsung ke dashboard
    if (isVerifiedProvider) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Jika user belum verified (pending/rejected) atau customer biasa, BOLEH akses halaman ini
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};