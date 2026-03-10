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
import { motion } from 'framer-motion';

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
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-lg flex flex-col justify-center items-center z-20">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-lg mx-auto bg-card p-8 md:p-10 shadow-xl shadow-primary/10 rounded-3xl relative text-card-foreground border border-border/50"
        >
            <motion.div variants={itemVariants}>
              <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Create Account</h1>
              <p className="text-lg text-center mb-8 text-muted-foreground">
                Start your journey with Vellon AI.
              </p>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <motion.div variants={itemVariants} className="space-y-1">
                <label className="text-sm font-medium text-foreground">Full Name (Optional)</label>
                <Input 
                  {...register('display_name')} 
                  placeholder="John Doe" 
                  className="bg-background border border-border rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary px-4 py-5 text-base placeholder:text-muted-foreground shadow-sm transition-all"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input 
                  {...register('email')} 
                  type="email" 
                  placeholder="john@example.com" 
                  className="bg-background border border-border rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary px-4 py-5 text-base placeholder:text-muted-foreground shadow-sm transition-all"
                />
                {errors.email && <p className="text-sm text-destructive font-medium mt-1">{errors.email.message}</p>}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input 
                  {...register('password')} 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-background border border-border rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary px-4 py-5 text-base placeholder:text-muted-foreground shadow-sm transition-all"
                />
                {errors.password && <p className="text-sm text-destructive font-medium mt-1">{errors.password.message}</p>}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <Input 
                  {...register('confirmPassword')} 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-background border border-border rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary px-4 py-5 text-base placeholder:text-muted-foreground shadow-sm transition-all"
                />
                {errors.confirmPassword && <p className="text-sm text-destructive font-medium mt-1">{errors.confirmPassword.message}</p>}
              </motion.div>
              
              {error && <motion.div variants={itemVariants} className="text-sm text-destructive font-medium mt-2">{error}</motion.div>}
              
              <motion.div variants={itemVariants} className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 rounded-xl shadow-md hover:shadow-lg mt-2 transition-all hover:scale-[1.01] active:scale-[0.98]" 
                  disabled={isLoading}
                >
                  {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                  Create Account
                </Button>
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="mt-8 text-center border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/signin" className="text-primary font-medium hover:underline transition-colors">
                  Sign In
                </Link>
              </p>
            </motion.div>
          </motion.div>
      </div>
    </div>
  );
}
