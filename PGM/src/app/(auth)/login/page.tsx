'use client';

import React, { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { setTabSession } from '@/lib/tabSession';
import { getTabId } from '@/lib/auth/tabSession';
import { useTabSession } from '@/lib/auth/useTabSession';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowRight, Shield, Users, CreditCard, BarChart3, Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { BackgroundElements } from '@/components/common/BackgroundElements';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { StayTrackLogo } from '@/components/common/StayTrackLogo';
import Link from 'next/link';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const router = useRouter();
  const { login: loginWithTabSession } = useTabSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      // Get tab ID for per-tab cookie isolation
      const tabId = getTabId();
      
      // Call custom login API with tabId for per-tab cookie creation
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          tabId,
        }),
      });

      const result = await response.json();

      if (!result.success || !result.data) {
        setError(result.message || 'Invalid credentials');
        return;
      }

      const { user, accessToken } = result.data;
      console.log('✅ Login successful - User role:', user.role);
      
      // Create per-tab session using the hook
      await loginWithTabSession(data.email, data.password);
      
      // Also use NextAuth for compatibility
      await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      
      // Store in old tab session system for backward compatibility
      if (user && accessToken) {
        setTabSession({
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role as 'OWNER' | 'TENANT' | 'ADMIN',
          accessToken,
        });
      }
      
      // Redirect based on role
      if (user.role === 'ADMIN') {
        console.log('🔐 Admin login - Redirecting to admin portal');
        router.push('/admin');
      } else if (user.role === 'OWNER') {
        console.log('👤 Owner login - Redirecting to owner dashboard');
        router.push('/owner/dashboard');
      } else if (user.role === 'TENANT') {
        console.log('🏠 Tenant login - Redirecting to tenant dashboard');
        router.push('/tenant/dashboard');
      } else {
        console.error('❌ Unknown role:', user.role);
        setError('Invalid user role. Please contact support.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0d0d0d]" suppressHydrationWarning>
      <BackgroundElements variant="login" />

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding & Features */}
          <motion.div 
            className="text-center lg:text-left space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            suppressHydrationWarning
          >
            <div className="space-y-6">
              <motion.div 
                className="flex items-center justify-center lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <StayTrackLogo size={48} color="#f5c518" showText={true} />
              </motion.div>
              
              <motion.h2 
                className="text-3xl lg:text-4xl font-bold text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Welcome Back!
              </motion.h2>
              
              <motion.p 
                className="text-lg text-gray-400 max-w-md mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Sign in to access your dashboard and manage your PG properties efficiently.
              </motion.p>
            </div>

            {/* Feature Highlights */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {[
                { icon: Users, text: "Manage Tenants" },
                { icon: CreditCard, text: "Billing & Payments" },
                { icon: BarChart3, text: "Analytics & Reports" },
                { icon: Shield, text: "Secure & Reliable" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl border border-[#333333] hover:border-[#f5c518]/50 transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05, x: 5 }}
                >
                  <feature.icon className="w-5 h-5 text-[#f5c518]" />
                  <span className="text-sm font-medium text-white">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center"
            suppressHydrationWarning
          >
            <Card className="w-full max-w-md glass-morphism border border-[#333333] shadow-2xl shadow-[#f5c518]/10">
              <CardHeader className="text-center pb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="w-16 h-16 bg-gradient-to-br from-[#f5c518] to-[#ffd000] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#f5c518]/30"
                >
                  <Lock className="w-8 h-8 text-[#0d0d0d]" />
                </motion.div>
                <CardTitle className="text-2xl font-bold text-white">Sign In</CardTitle>
                <CardDescription className="text-gray-400">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    <Label htmlFor="email" className="text-sm font-medium text-gray-300">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        {...register('email')}
                        className={`pl-10 h-12 bg-[#1a1a1a] border-[#333333] text-white placeholder:text-gray-500 focus:border-[#f5c518] focus:ring-[#f5c518] ${errors.email ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                  >
                    <Label htmlFor="password" className="text-sm font-medium text-gray-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        {...register('password')}
                        className={`pl-10 pr-10 h-12 bg-[#1a1a1a] border-[#333333] text-white placeholder:text-gray-500 focus:border-[#f5c518] focus:ring-[#f5c518] ${errors.password ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </motion.div>

                  <motion.div
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.75 }}
                  >
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#333333] bg-[#1a1a1a] checked:bg-[#f5c518] checked:border-[#f5c518]" />
                      <span className="text-sm text-gray-400">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      suppressHydrationWarning={true}
                      className="text-sm text-[#f5c518] hover:text-[#ffd000] font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-[#f5c518] to-[#ffd000] hover:from-[#ffd000] hover:to-[#f5c518] text-[#0d0d0d] font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#f5c518]/50 disabled:opacity-50" 
                      disabled={isLoading}
                      suppressHydrationWarning={true}
                      magnetic
                      showRipple
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Sign In</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>

                <motion.div 
                  className="text-center space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.9 }}
                >
                  <p className="text-sm text-gray-400">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-[#f5c518] hover:text-[#ffd000] font-medium transition-colors">
                      Create Owner Account
                    </Link>
                  </p>
                </motion.div>

                {/* Demo Credentials */}
                {/* <motion.div 
                  className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1 }}
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Demo Credentials</p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                      <span className="font-medium text-blue-900">Owner:</span>
                      <span className="text-blue-700">owner@example.com / password123</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                      <span className="font-medium text-purple-900">Tenant:</span>
                      <span className="text-purple-700">tenant@example.com / password123</span>
                    </div>
                  </div>
                </motion.div> */}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} />
    </div>
  );
}
