// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect langsung ke dashboard. 
  // Middleware akan menangani jika user belum login (diarahkan ke /login).
  redirect('/dashboard');
}