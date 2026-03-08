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
import { CardFooter } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Eye, EyeOff } from 'lucide-react';

import { AuthLeftPanel } from '@/app/(auth)/components/AuthLeftPanel';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function SignInPage() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/v1/auth/login', data);
      const { access_token, refresh_token } = response.data;
      setTokens(access_token, refresh_token || '');

      const userResponse = await api.get('/api/v1/auth/me');
      setUser(userResponse.data);

      router.push('/dashboard');
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } };
      setError(axErr.response?.data?.detail || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4 font-handwriting">
      <div className="w-full max-w-6xl flex flex-col md:flex-row min-h-[min(90vh,640px)] gap-8 md:gap-12">
        {/* Left: visual panel (desktop only) */}
        <AuthLeftPanel />

        {/* Right: Sign-in form (Sticky Note) */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 z-20">
          <div className="w-full max-w-md mx-auto bg-[#fef08a] p-8 md:p-10 shadow-[8px_8px_16px_rgba(0,0,0,0.15)] -rotate-2 relative text-black rounded-sm transition-transform hover:-rotate-1 duration-300">
            {/* Sticky note tape effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black/10 -translate-y-3 shadow-sm rotate-2"></div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 mt-2">Welcome back!</h1>
            <p className="text-2xl text-center mb-8 text-neutral-800">
              Enter your credentials to jump back in.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="signin-email" className="text-2xl font-bold">
                  Email
                </label>
                <Input
                  id="signin-email"
                  {...register('email')}
                  type="email"
                  placeholder="example@mail.com"
                  autoComplete="email"
                  className="bg-transparent border-0 border-b-2 border-neutral-400/50 rounded-none focus-visible:ring-0 focus-visible:border-black px-0 text-2xl placeholder:text-neutral-500 shadow-none h-auto py-2"
                />
                {errors.email && (
                  <p className="text-xl text-red-600 font-bold">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="signin-password" className="text-2xl font-bold">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="bg-transparent border-0 border-b-2 border-neutral-400/50 rounded-none focus-visible:ring-0 focus-visible:border-black px-0 text-2xl placeholder:text-neutral-500 pr-10 shadow-none h-auto py-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-700 hover:text-black"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xl text-red-600 font-bold">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-xl mt-4">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-800 hover:text-black font-bold">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-neutral-500 bg-transparent text-black focus:ring-black h-5 w-5 accent-black"
                  />
                  Remember me
                </label>
                <Link
                  href="#"
                  className="text-neutral-800 font-bold hover:underline hover:text-black"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot Password?
                </Link>
              </div>

              {error && (
                <p className="text-xl text-red-600 font-bold">{error}</p>
              )}

              <Button type="submit" className="w-full bg-neutral-900 hover:bg-black text-white text-2xl py-6 rounded-none shadow-md mt-8 font-handwriting" disabled={isLoading}>
                {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                Sign In
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t-2 border-neutral-400/50" />
              </div>
              <span className="relative flex justify-center text-xl uppercase font-bold text-neutral-600 px-4 bg-[#fef08a]">
                Or sign in with
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent border-2 border-neutral-500 text-neutral-900 font-bold hover:bg-neutral-900 hover:text-white rounded-none text-2xl py-6 font-handwriting"
                disabled
              >
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent border-2 border-neutral-500 text-neutral-900 font-bold hover:bg-neutral-900 hover:text-white rounded-none text-2xl py-6 font-handwriting"
                disabled
              >
                Apple
              </Button>
            </div>

            <CardFooter className="px-0 pb-0 pt-8 justify-center border-0">
              <p className="text-2xl text-neutral-800">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-black font-bold hover:underline">
                  Create an Account
                </Link>
              </p>
            </CardFooter>
          </div>
        </div>
      </div>
    </div>
  );
}
