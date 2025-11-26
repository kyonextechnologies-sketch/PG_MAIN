'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { UPIPaymentModal } from '@/app/tenant/payments/UPIPaymentModal';

interface SubscriptionPlan {
  id: string;
  name: string;
  packageName: string;
  price: number;
  billingCycle: string;
  features: string[];
}

interface SubscriptionResponse {
  id: string;
  ownerId: string;
  packageName: string;
  status: string;
  startDate: string;
  endDate: string | null;
  price: number;
  billingCycle: string;
  autoRenew: boolean;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [adminUpiId, setAdminUpiId] = useState('');
  const [adminUpiName, setAdminUpiName] = useState('');

  const createSubscriptionAfterLogin = React.useCallback(async (plan: SubscriptionPlan) => {
    try {
      // Create subscription
      const response = await apiClient.post<SubscriptionResponse>('/subscriptions', {
        packageName: plan.packageName,
        billingCycle: plan.billingCycle,
        price: plan.price,
      });

      if (response.success && response.data) {
        // Confirm payment
        await apiClient.post('/subscriptions/confirm-payment', {
          subscriptionId: response.data.id,
          transactionId: `sub_${Date.now()}`,
        });

        // Clear pending payment
        sessionStorage.removeItem('pendingSubscriptionPayment');
        
        // Redirect to dashboard
        router.push('/owner/dashboard?subscription=active');
      }
    } catch (error) {
      console.error('Failed to create subscription after login:', error);
      sessionStorage.removeItem('pendingSubscriptionPayment');
      alert('Payment successful but subscription creation failed. Please contact support.');
    }
  }, [router]);

  useEffect(() => {
    const registered = searchParams.get('registered') === 'true';
    const pendingPayment = typeof window !== 'undefined' 
      ? sessionStorage.getItem('pendingSubscriptionPayment') 
      : null;
    
    // If user just logged in after payment, create subscription automatically
    if (status === 'authenticated' && pendingPayment && session?.user?.role === 'OWNER') {
      const { plan } = JSON.parse(pendingPayment);
      // Use setTimeout to avoid calling during render
      setTimeout(() => {
        createSubscriptionAfterLogin(plan);
      }, 100);
      return;
    }
    
    // Allow access if user just registered (even without auth)
    if (registered && status === 'unauthenticated') {
      // User just registered, allow them to select plan
      loadPlans();
      loadAdminUpiSettings();
      setLoading(false);
      return;
    }

    // For authenticated users, check role
    if (status === 'authenticated') {
      if (session?.user?.role !== 'OWNER') {
        router.push('/');
        return;
      }
      loadPlans();
      loadCurrentSubscription();
      loadAdminUpiSettings();
      return;
    }

    // If not registered and not authenticated, redirect to login
    if (status === 'unauthenticated' && !registered) {
      router.push('/login?redirect=/subscription');
      return;
    }
  }, [status, session, router, searchParams, createSubscriptionAfterLogin]);

  const loadPlans = async () => {
    try {
      const response = await apiClient.get<SubscriptionPlan[]>('/subscriptions/plans');
      if (response.success && response.data) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSubscription = async () => {
    try {
      const response = await apiClient.get('/subscriptions/me');
      if (response.success && response.data) {
        setCurrentSubscription(response.data);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const loadAdminUpiSettings = async () => {
    try {
      // Get admin UPI settings from public API endpoint
      const response = await apiClient.get<{ upiId: string; upiName: string }>('/subscriptions/upi-settings');
      if (response.success && response.data) {
        setAdminUpiId(response.data.upiId || process.env.NEXT_PUBLIC_ADMIN_UPI_ID || 'admin@paytm');
        setAdminUpiName(response.data.upiName || process.env.NEXT_PUBLIC_ADMIN_UPI_NAME || 'PG Management System');
      } else {
        // Fallback to environment variables if API fails
        setAdminUpiId(process.env.NEXT_PUBLIC_ADMIN_UPI_ID || 'admin@paytm');
        setAdminUpiName(process.env.NEXT_PUBLIC_ADMIN_UPI_NAME || 'PG Management System');
      }
    } catch (error) {
      console.error('Failed to load UPI settings:', error);
      // Fallback to environment variables on error
      setAdminUpiId(process.env.NEXT_PUBLIC_ADMIN_UPI_ID || 'admin@paytm');
      setAdminUpiName(process.env.NEXT_PUBLIC_ADMIN_UPI_NAME || 'PG Management System');
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedPlan) return;

    try {
      // Check if user just registered (needs to login first)
      const registered = searchParams.get('registered') === 'true';
      const isAuthenticated = status === 'authenticated';

      // If user just registered, store payment info and login them
      if (registered && !isAuthenticated) {
        const pendingRegistration = typeof window !== 'undefined' 
          ? sessionStorage.getItem('pendingRegistration') 
          : null;

        if (pendingRegistration) {
          try {
            const { email, password } = JSON.parse(pendingRegistration);
            
            // Store selected plan for after login
            sessionStorage.setItem('pendingSubscriptionPayment', JSON.stringify({
              plan: selectedPlan,
            }));
            
            console.log('🔐 Logging in user after payment...');
            
            // Login the user
            const result = await signIn('credentials', {
              email,
              password,
              redirect: false,
            });

            if (result?.error) {
              console.error('Login error:', result.error);
              sessionStorage.removeItem('pendingSubscriptionPayment');
              throw new Error('Failed to login after registration');
            }

            // Clear pending registration
            sessionStorage.removeItem('pendingRegistration');
            
            // Page will reload and useEffect will handle subscription creation
            window.location.reload();
            return;
          } catch (loginError) {
            console.error('Failed to login after registration:', loginError);
            sessionStorage.removeItem('pendingSubscriptionPayment');
            alert('Payment successful but failed to complete registration. Please login manually.');
            router.push('/login');
            return;
          }
        } else {
          // No pending registration found
          alert('Registration data not found. Please login manually.');
          router.push('/login');
          return;
        }
      }

      // If already authenticated, create subscription directly
      if (isAuthenticated) {
        // Create subscription
        const response = await apiClient.post<SubscriptionResponse>('/subscriptions', {
          packageName: selectedPlan.packageName,
          billingCycle: selectedPlan.billingCycle,
          price: selectedPlan.price,
        });

        if (response.success && response.data) {
          // Confirm payment
          await apiClient.post('/subscriptions/confirm-payment', {
            subscriptionId: response.data.id,
            transactionId: `sub_${Date.now()}`,
          });

          // Redirect to dashboard
          router.push('/owner/dashboard?subscription=active');
        }
      }
    } catch (error) {
      console.error('Failed to create subscription:', error);
      alert('Payment successful but subscription creation failed. Please contact support.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
        <Loader2 className="h-8 w-8 animate-spin text-[#f5c518]" />
      </div>
    );
  }

  const registered = searchParams.get('registered') === 'true';

  return (
    <div className="min-h-screen bg-[#0d0d0d] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {registered && (
          <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-center">
              ✅ Registration successful! Please select a subscription plan to continue.
            </p>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
          <p className="text-gray-400 text-lg">
            Select the perfect plan for managing your PG properties
          </p>
        </div>

        {currentSubscription && currentSubscription.status === 'ACTIVE' && (
          <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-center">
              You have an active subscription: {currentSubscription.packageName} (₹{currentSubscription.price})
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isPopular = plan.name.includes('Standard') && !plan.name.includes('Yearly');
            const isYearly = plan.billingCycle === 'QUARTERLY';

            return (
              <Card
                key={plan.id}
                className={`relative bg-[#1a1a1a] border-2 ${
                  isPopular
                    ? 'border-[#f5c518] shadow-lg shadow-[#f5c518]/20'
                    : 'border-[#333333]'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#f5c518] text-[#0d0d0d] px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {plan.billingCycle === 'MONTHLY' ? 'Billed monthly' : 'Billed quarterly'}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">₹{plan.price}</span>
                    <span className="text-gray-400 ml-2">
                      /{plan.billingCycle === 'MONTHLY' ? 'month' : 'quarter'}
                    </span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-[#f5c518] mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full ${
                      isPopular
                        ? 'bg-[#f5c518] hover:bg-[#ffd000] text-[#0d0d0d]'
                        : 'bg-[#2b2b2b] hover:bg-[#333333] text-white'
                    }`}
                    disabled={currentSubscription?.status === 'ACTIVE'}
                  >
                    {currentSubscription?.status === 'ACTIVE' ? (
                      'Current Plan'
                    ) : (
                      <>
                        Select Plan
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {selectedPlan && (
        <UPIPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          invoice={{
            id: 'subscription',
            month: selectedPlan.name,
            amount: selectedPlan.price,
          }}
          upiId={adminUpiId}
          upiName={adminUpiName}
          onPaymentInitiated={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

