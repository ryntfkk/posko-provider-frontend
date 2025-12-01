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
  exp: number;
}

// Routes yang tidak butuh login
const PUBLIC_ROUTES = [
  '/login',
  '/register',
];

// Routes khusus Mitra
const PROVIDER_ROUTES = ['/dashboard', '/jobs', '/messages', '/settings'];

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

  // 1. Jika User belum login dan akses halaman non-public -> Lempar ke Login
  if (!user && !isPublicRoute(pathname)) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Jika User sudah login tapi akses halaman Login/Register -> Lempar ke Dashboard
  if (user && isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Proteksi Halaman Provider
  if (isProviderRoute(pathname)) {
    // Cek apakah user punya role provider
    const hasProviderRole = 
      user?.activeRole === 'provider' || 
      user?.role === 'provider' || 
      user?.roles?.includes('provider');

    if (!hasProviderRole) {
      // Jika bukan provider (misal customer nyasar), logout atau redirect ke info
      // Di sini kita redirect ke login untuk memaksa ganti akun/logout
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};