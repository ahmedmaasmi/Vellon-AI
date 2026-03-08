'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { AuthLeftPanel } from '@/app/(auth)/components/AuthLeftPanel';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  display_name: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/v1/auth/register', {
        email: data.email,
        password: data.password,
        display_name: data.display_name,
      });

      const { access_token, refresh_token } = response.data;
      setTokens(access_token, refresh_token || '');

      const userResponse = await api.get('/api/v1/auth/me');
      setUser(userResponse.data);

      router.push('/dashboard');
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } };
      setError(axErr.response?.data?.detail || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4 font-handwriting">
      <div className="w-full max-w-6xl flex flex-col md:flex-row min-h-[min(90vh,640px)] gap-8 md:gap-12">
        {/* Left: visual panel (desktop only) */}
        <AuthLeftPanel />

        {/* Right: Register form (Sticky Note) */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 z-20">
          <div className="w-full max-w-md mx-auto bg-[#fef08a] p-8 md:p-10 shadow-[8px_8px_16px_rgba(0,0,0,0.15)] rotate-1 relative text-black rounded-sm transition-transform hover:-rotate-1 duration-300">
            {/* Sticky note tape effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black/10 -translate-y-3 shadow-sm -rotate-2"></div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 mt-2">Create Account</h1>
            <p className="text-2xl text-center mb-8 text-neutral-800">
              Start your journey with NoteMind AI.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-2xl font-bold">Full Name (Optional)</label>
                <Input 
                  {...register('display_name')} 
                  placeholder="John Doe" 
                  className="bg-transparent border-0 border-b-2 border-neutral-400/50 rounded-none focus-visible:ring-0 focus-visible:border-black px-0 text-2xl placeholder:text-neutral-500 shadow-none h-auto py-1"
                />
              </div>
              <div className="space-y-1">
                <label className="text-2xl font-bold">Email</label>
                <Input 
                  {...register('email')} 
                  type="email" 
                  placeholder="john@example.com" 
                  className="bg-transparent border-0 border-b-2 border-neutral-400/50 rounded-none focus-visible:ring-0 focus-visible:border-black px-0 text-2xl placeholder:text-neutral-500 shadow-none h-auto py-1"
                />
                {errors.email && <p className="text-xl text-red-600 font-bold">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-2xl font-bold">Password</label>
                <Input 
                  {...register('password')} 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-transparent border-0 border-b-2 border-neutral-400/50 rounded-none focus-visible:ring-0 focus-visible:border-black px-0 text-2xl placeholder:text-neutral-500 shadow-none h-auto py-1"
                />
                {errors.password && <p className="text-xl text-red-600 font-bold">{errors.password.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-2xl font-bold">Confirm Password</label>
                <Input 
                  {...register('confirmPassword')} 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-transparent border-0 border-b-2 border-neutral-400/50 rounded-none focus-visible:ring-0 focus-visible:border-black px-0 text-2xl placeholder:text-neutral-500 shadow-none h-auto py-1"
                />
                {errors.confirmPassword && <p className="text-xl text-red-600 font-bold">{errors.confirmPassword.message}</p>}
              </div>
              
              {error && <div className="text-xl text-red-600 font-bold">{error}</div>}
              
              <Button type="submit" className="w-full bg-neutral-900 hover:bg-black text-white text-2xl py-6 rounded-none shadow-md mt-6 font-handwriting" disabled={isLoading}>
                {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                Create Account
              </Button>
            </form>

            <div className="mt-8 text-center border-t-2 border-neutral-400/50 pt-6">
              <p className="text-2xl text-neutral-800">
                Already have an account?{' '}
                <Link href="/signin" className="text-black font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
