'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardFooter } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function SignInPage() {
  const router = useRouter();
  const { setTokens, setUser, isAuthenticated, hasHydrated } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [hasHydrated, isAuthenticated, router]);

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
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-lg flex flex-col justify-center items-center z-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-lg mx-auto bg-card p-8 md:p-10 shadow-xl shadow-primary/10 rounded-3xl relative text-card-foreground border border-border/50"
        >
            <motion.div variants={itemVariants}>
              <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Welcome back!</h1>
              <p className="text-lg text-center mb-8 text-muted-foreground">
                Enter your credentials to jump back in.
              </p>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <motion.div variants={itemVariants} className="space-y-2">
                <label htmlFor="signin-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="signin-email"
                  {...register('email')}
                  type="email"
                  placeholder="example@mail.com"
                  autoComplete="email"
                  className="bg-background border border-border rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary px-4 py-6 text-base placeholder:text-muted-foreground shadow-sm transition-all"
                />
                {errors.email && (
                  <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
                )}
              </motion.div>
              
              <motion.div variants={itemVariants} className="space-y-2">
                <label htmlFor="signin-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="bg-background border border-border rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary px-4 py-6 text-base placeholder:text-muted-foreground pr-12 shadow-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive font-medium">{errors.password.message}</p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center justify-between text-sm mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground font-medium transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-border bg-background text-primary focus:ring-primary/20 h-4 w-4 accent-primary transition-all"
                  />
                  Remember me
                </label>
                <Link
                  href="#"
                  className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot Password?
                </Link>
              </motion.div>

              {error && (
                <motion.p variants={itemVariants} className="text-sm text-destructive font-medium">
                  {error}
                </motion.p>
              )}

              <motion.div variants={itemVariants}>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 rounded-xl shadow-md hover:shadow-lg mt-4 transition-all hover:scale-[1.01] active:scale-[0.98]" 
                  disabled={isLoading}
                >
                  {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                  Sign In
                </Button>
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <span className="relative flex justify-center text-sm uppercase font-medium text-muted-foreground px-4 bg-card">
                Or continue with
              </span>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent border border-border text-foreground font-medium hover:bg-muted rounded-xl text-base py-6 transition-all"
                disabled
              >
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent border border-border text-foreground font-medium hover:bg-muted rounded-xl text-base py-6 transition-all"
                disabled
              >
                Apple
              </Button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <CardFooter className="px-0 pb-0 pt-8 justify-center border-0">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-primary font-medium hover:underline transition-colors">
                    Create an Account
                  </Link>
                </p>
              </CardFooter>
            </motion.div>
          </motion.div>
      </div>
    </div>
  );
}
