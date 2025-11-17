'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Loader2, ArrowRight, Shield, Users, CreditCard, BarChart3, Lock, Mail, User, CheckCircle, Phone, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { BackgroundElements } from '@/components/common/BackgroundElements';
import { StayTrackLogo } from '@/components/common/StayTrackLogo';
import { apiClient } from '@/lib/apiClient';
import { OTPInput } from '@/components/auth/OTPInput';
import Link from 'next/link';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [verificationToken, setVerificationToken] = useState(''); // Store token from OTP verification
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'OWNER' // Default to owner only
    }
  });

  // Clear any errors on mount to ensure fresh state
  useEffect(() => {
    setError('');
    console.log('✅ Registration page loaded - Phone verification is OPTIONAL');
  }, []);

  // Handle sending OTP
  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSendingOTP(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/send-otp', {
        phoneNumber: `+91${phoneNumber}`, // Add country code
      });

      if (response.success) {
        setShowOTPInput(true);
        setError('');
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err: unknown) {
      console.error('OTP send error:', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async (otp: string) => {
    try {
      const response = await apiClient.post<{ 
        verified: boolean; 
        token: string;
      }>('/auth/verify-otp', {
        phoneNumber: `+91${phoneNumber}`,
        otp,
      });

      if (response.success && response.data) {
        setIsOTPVerified(true);
        setShowOTPInput(false);
        setVerificationToken(response.data.token); // Store the verification token
        setError(''); // Clear any previous errors
        console.log('✅ Phone verified! Token stored.');
        return { success: true };
      } else {
        setError(response.message || 'Invalid OTP');
        return { success: false, error: response.message || 'Invalid OTP' };
      }
    } catch (err: unknown) {
      console.error('OTP verify error:', err);
      const errorMessage = 'Failed to verify OTP. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Handle OTP resend
  const handleResendOTP = async () => {
    setError('');
    try {
      const response = await apiClient.post('/auth/resend-otp', {
        phoneNumber: `+91${phoneNumber}`,
      });

      if (response.success) {
        return { success: true };
      } else {
        const errorMsg = response.message || 'Failed to resend OTP';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      console.error('OTP resend error:', err);
      const errorMsg = 'Failed to resend OTP. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');

    try {
      // Prepare registration payload
      const payload: {
        email: string;
        password: string;
        name: string;
        role: string;
        phone?: string;
        phoneVerificationToken?: string;
      } = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        name: data.name.trim(),
        role: data.role || 'OWNER', // Default to OWNER for registration page
      };

      // Add phone and verification token if verified
      if (isOTPVerified && phoneNumber && verificationToken) {
        payload.phone = `+91${phoneNumber}`;
        payload.phoneVerificationToken = verificationToken;
        console.log('📱 Including verified phone in registration');
      } else {
        console.log('⚠️ Phone verification skipped - registering without phone');
      }

      console.log('Registering user:', { ...payload, password: '***' });

      // Call the backend API
      const response = await apiClient.post<{ user: { id: string; email: string; name: string; role: string } }>(
        '/auth/register',
        payload
      );

      if (!response.success) {
        throw new Error(response.error || response.message || 'Registration failed');
      }

      console.log('Registration successful:', response.data);

      // Show success message and redirect to login
      setError('');
      
      // Redirect to login page with success message
      router.push('/login?registered=true');
    } catch (error) {
      console.error('Registration error:', error);
      
      // Extract error message
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific error cases
        if (error.message.includes('already exists') || error.message.includes('email')) {
          errorMessage = 'An account with this email already exists. Please use a different email or try logging in.';
        } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'CORS error. Please contact support if this issue persists.';
        } else if (error.message.includes('Invalid API URL') || error.message.includes('protocol')) {
          errorMessage = 'Configuration error. Please contact support.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0d0d0d]">
      <BackgroundElements variant="register" />

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding & Benefits */}
          <motion.div 
            className="text-center lg:text-left space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
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
                Become a PG Owner
              </motion.h2>
              
              <motion.p 
                className="text-lg text-gray-400 max-w-md mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Create your owner account and start managing your PG properties with our comprehensive platform.
              </motion.p>
            </div>

            {/* Owner Benefits */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h3 className="text-xl font-semibold text-white mb-4">Why Choose Our Platform?</h3>
              {[
                { icon: Users, text: "Manage unlimited tenants", subtext: "Track tenant information and room assignments" },
                { icon: CreditCard, text: "Automated billing system", subtext: "Generate invoices and track payments" },
                { icon: BarChart3, text: "Real-time analytics", subtext: "Monitor occupancy and revenue" },
                { icon: Shield, text: "Secure & reliable", subtext: "Bank-grade security for your data" }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl border border-[#333333] hover:border-[#f5c518]/50 transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[#f5c518] to-[#ffd000] rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#f5c518]/30">
                    <benefit.icon className="w-5 h-5 text-[#0d0d0d]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{benefit.text}</h4>
                    <p className="text-sm text-gray-400">{benefit.subtext}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Note about tenant accounts */}
            <motion.div 
              className="p-4 bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl border border-[#f5c518]/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-[#f5c518]" />
                <span className="font-medium text-white">Tenant Accounts</span>
              </div>
              <p className="text-sm text-gray-400">
                Tenant accounts are created by PG owners. Tenants will receive login credentials from their property owners.
              </p>
            </motion.div>
          </motion.div>

          {/* Right Side - Registration Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center"
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
                <CardTitle className="text-2xl font-bold text-white">Create Owner Account</CardTitle>
                <CardDescription className="text-gray-400">
                  Join thousands of PG owners managing their properties efficiently
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
                    <Label htmlFor="name" className="text-sm font-medium text-gray-300">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        {...register('name')}
                        className={`pl-10 h-12 bg-[#1a1a1a] border-[#333333] text-white placeholder:text-gray-500 focus:border-[#f5c518] focus:ring-[#f5c518] ${errors.name ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
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

                  {/* Phone Number Field with OTP Verification */}
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.75 }}
                  >
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-300">
                      Phone Number <span className="text-gray-500">(Optional - for OTP verification)</span>
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <div className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">+91</div>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter 10-digit number"
                          value={phoneNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhoneNumber(value);
                            setIsOTPVerified(false);
                            setShowOTPInput(false);
                            setVerificationToken(''); // Reset token when phone changes
                          }}
                          disabled={isOTPVerified}
                          className={`pl-16 h-12 bg-[#1a1a1a] border-[#333333] text-white placeholder:text-gray-500 focus:border-[#f5c518] focus:ring-[#f5c518] ${isOTPVerified ? 'bg-[#1a1a1a]/50' : ''}`}
                          maxLength={10}
                        />
                        {isOTPVerified && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      {!isOTPVerified && !showOTPInput && (
                        <Button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={phoneNumber.length !== 10 || isSendingOTP}
                          className="h-12 px-6 bg-[#1a1a1a] border border-[#f5c518] text-[#f5c518] hover:bg-[#f5c518] hover:text-[#0d0d0d] transition-all"
                        >
                          {isSendingOTP ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Send OTP'
                          )}
                        </Button>
                      )}
                    </div>
                    {phoneNumber && phoneNumber.length !== 10 && !isOTPVerified && (
                      <p className="text-sm text-yellow-500">Please enter a valid 10-digit phone number</p>
                    )}
                    {isOTPVerified && (
                      <p className="text-sm text-green-500 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Phone number verified successfully!
                      </p>
                    )}
                  </motion.div>

                  {/* OTP Input Section */}
                  {showOTPInput && !isOTPVerified && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <OTPInput
                        length={6}
                        onComplete={handleVerifyOTP}
                        onResend={handleResendOTP}
                      />
                    </motion.div>
                  )}

                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                  >
                    <Label htmlFor="password" className="text-sm font-medium text-gray-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a strong password"
                        {...register('password')}
                        className={`pl-10 h-12 bg-[#1a1a1a] border-[#333333] text-white placeholder:text-gray-500 focus:border-[#f5c518] focus:ring-[#f5c518] ${errors.password ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.9 }}
                  >
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        {...register('confirmPassword')}
                        className={`pl-10 h-12 bg-[#1a1a1a] border-[#333333] text-white placeholder:text-gray-500 focus:border-[#f5c518] focus:ring-[#f5c518] ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                    )}
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 1 }}
                  >
                    <Label htmlFor="company" className="text-sm font-medium text-gray-300">Company Name (Optional)</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="company"
                        placeholder="Your company or business name"
                        {...register('company')}
                        className={`pl-10 h-12 bg-[#1a1a1a] border-[#333333] text-white placeholder:text-gray-500 focus:border-[#f5c518] focus:ring-[#f5c518] ${errors.company ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.company && (
                      <p className="text-sm text-red-500">{errors.company.message}</p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 1.1 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-[#f5c518] to-[#ffd000] hover:from-[#ffd000] hover:to-[#f5c518] text-[#0d0d0d] font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#f5c518]/50 disabled:opacity-50" 
                      disabled={isLoading}
                      magnetic
                      showRipple
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating account...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Create Owner Account</span>
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
                  transition={{ duration: 0.4, delay: 1.2 }}
                >
                  <p className="text-sm text-gray-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[#f5c518] hover:text-[#ffd000] font-medium transition-colors">
                      Sign in
                    </Link>
                  </p>
                </motion.div>

                {/* Owner Benefits Summary */}
                <motion.div 
                  className="p-4 bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl border border-[#f5c518]/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.3 }}
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-[#f5c518]" />
                    <p className="text-sm font-medium text-white">What you get as an owner:</p>
                  </div>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>• Unlimited property management</p>
                    <p>• Automated tenant onboarding</p>
                    <p>• Real-time payment tracking</p>
                    <p>• Advanced analytics dashboard</p>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}