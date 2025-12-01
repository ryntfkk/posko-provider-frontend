'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/features/auth/api';
import { jwtDecode } from 'jwt-decode';

const EyeIcon = () => (
  <svg className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Update Interface DecodedToken agar sesuai dengan struktur data user
interface DecodedToken {
  userId: string;
  email: string;
  role?: string; 
  activeRole?: string;
  roles?: string[];
  exp: number;
}

export default function LoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const setCookie = (name: string, value: string, days: number = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.includes('@')) {
      setErrorMsg('Mohon masukkan alamat email yang valid.');
      return;
    }
    if (password.length < 1) {
      setErrorMsg('Mohon masukkan password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginUser({ email, password });
      const token = result.data.tokens.accessToken;
      
      localStorage.setItem('posko_token', token);
      setCookie('posko_token', token);
      
      const decoded = jwtDecode<DecodedToken>(token);
      
      // Validasi Role yang lebih fleksibel (Mengecek activeRole, role tunggal, atau array roles)
      const isProvider = 
        decoded.activeRole === 'provider' || 
        decoded.role === 'provider' || 
        (decoded.roles && decoded.roles.includes('provider'));

      const isAdmin = 
        decoded.activeRole === 'admin' || 
        decoded.role === 'admin' || 
        (decoded.roles && decoded.roles.includes('admin'));

      // Jika bukan Provider dan bukan Admin, tolak akses
      if (!isProvider && !isAdmin) {
        setErrorMsg('Akun ini bukan akun Mitra. Silakan gunakan aplikasi Customer.');
        setIsLoading(false);
        // Hapus token jika gagal validasi role agar tidak tersimpan
        localStorage.removeItem('posko_token');
        return;
      }
      
      // Redirect ke Dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Gagal login, periksa email atau password.';
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  return (  
    <div className="min-h-screen bg-white text-gray-900 font-sans flex">
      
      {/* Left Column: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 relative bg-white z-10">
        
        {/* Logo */}
        <div className="absolute top-8 left-6 lg:left-8 flex items-center gap-2">
          <div className="w-9 h-9 relative bg-white shadow-sm rounded-lg p-1 border border-gray-100">
            <Image src="/logo.png" alt="Logo Posko" fill className="object-contain"/>
          </div>
          <span className="text-xl font-bold tracking-tight">
            Posko<span className="text-red-600">.</span> <span className="text-gray-400 font-medium text-sm ml-1">Mitra</span>
          </span>
        </div>

        <div className="max-w-md w-full mx-auto mt-10 lg:mt-0">
          <div className="mb-10">
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3 tracking-tight">Area Mitra</h1>
            <p className="text-gray-500 text-base lg:text-lg">Masuk untuk mengelola pesanan dan pekerjaan.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6 w-full">
            
            {/* Error Alert */}
            {errorMsg && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl flex items-center gap-3 animate-pulse">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-gray-700 text-xs font-bold uppercase tracking-wider">Email Mitra</label>
              <input
                id="email"
                type="email"
                className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                placeholder="mitra@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-gray-700 text-xs font-bold uppercase tracking-wider">Password</label>
                <Link href="#" className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline">Lupa Password?</Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-4 flex items-center focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-xl shadow-gray-200 hover:bg-red-600 hover:shadow-red-200 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  <span>Memproses...</span>
                </>
              ) : (
                'Masuk Dashboard'
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500">
              Belum terdaftar sebagai mitra? <br/>
              <span className="font-bold text-gray-800">Hubungi Admin untuk pendaftaran.</span>
            </p>
          </div>
        </div>

        <div className="absolute bottom-4 left-0 w-full text-center lg:hidden">
          <span className="text-[10px] text-gray-300">© 2024 Posko Mitra</span>
        </div>
      </div>

      {/* Right Column: Visual */}
      <div className="hidden lg:block w-1/2 relative bg-gray-900 overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=2070&auto=format&fit=crop" 
          alt="Technician Visual"
          fill
          className="object-cover opacity-60 mix-blend-overlay"
          priority
        />
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-transparent via-gray-900/40 to-gray-900"></div>
        <div className="absolute inset-0 flex flex-col justify-between p-16 text-white z-20">
          <div className="flex justify-end">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-medium">
              Aplikasi Khusus Mitra
            </div>
          </div>
          <div className="space-y-6">
            <div className="w-16 h-1 bg-red-600 rounded-full"></div>
            <h2 className="text-5xl font-bold leading-tight tracking-tight">
              Kelola Pekerjaan <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Lebih Efisien.</span>
            </h2>
            <p className="text-gray-300 text-lg max-w-md leading-relaxed">
              Pantau order masuk, atur jadwal, dan terima pembayaran dengan mudah melalui dashboard Posko Mitra.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}