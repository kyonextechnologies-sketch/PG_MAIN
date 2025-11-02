'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, CreditCard, BarChart3, Home as HomeIcon, ArrowRight, Star, CheckCircle, Shield, Zap, Globe } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ClientOnly } from '@/components/common/ClientOnly';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { addNotification } = useUIStore();

  useEffect(() => {
    if (session) {
      // Update auth store with session data
      setUser({
        id: session.user?.id || '',
        name: session.user?.name || '',
        email: session.user?.email || '',
        role: session.user?.role || 'TENANT',
      });

      // Add welcome notification
      addNotification({
        type: 'success',
        title: 'Welcome back!',
        message: `Welcome back, ${session.user?.name}!`,
        read: false,
      });

      if (session.user?.role === 'OWNER') {
        router.push('/owner/dashboard');
      } else if (session.user?.role === 'TENANT') {
        router.push('/tenant/dashboard');
      }
    }
  }, [session, router, setUser, addNotification]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="relative">
                <Building className="h-8 w-8 text-blue-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Smart PG Manager
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="outline" className="hidden md:block border-blue-200 hover:border-blue-300 transition-all duration-300 hover:scale-105">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="hidden md:block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
              Smart PG Management
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient">
                {" "}Made Simple
              </span>
          </h1>
          </div>
          
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-700 sm:text-xl md:text-2xl animate-fade-in-delay font-semibold">
            A comprehensive solution for PG owners and tenants to manage properties, 
            payments, and maintenance requests efficiently.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-2">
            <Link href="/register">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Get Started 
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Link href="/login">
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-blue-200 hover:border-blue-300 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
              Why Choose Smart PG Manager?
            </h2>
            <p className="mt-4 text-lg text-gray-700 max-w-2xl mx-auto font-semibold">
              Powerful features designed to streamline your PG management experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: HomeIcon,
                title: "Property Management",
                description: "Manage multiple properties, rooms, and beds with ease",
                color: "text-blue-600",
                bgColor: "bg-blue-50"
              },
              {
                icon: Users,
                title: "Tenant Management", 
                description: "Track tenant information, KYC, and room assignments",
                color: "text-green-600",
                bgColor: "bg-green-50"
              },
              {
                icon: CreditCard,
                title: "Billing & Payments",
                description: "Automated invoicing and UPI payment integration",
                color: "text-purple-600", 
                bgColor: "bg-purple-50"
              },
              {
                icon: BarChart3,
                title: "Analytics & Reports",
                description: "Detailed reports and insights for better decision making",
                color: "text-orange-600",
                bgColor: "bg-orange-50"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group animate-fade-in"
                style={{ animationDelay: `${0.1 + index * 0.1}s` }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm hover:-translate-y-2">
                  <CardHeader className="text-center p-8">
                    <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-gray-700 leading-relaxed font-medium">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            ))}
          </div>
        </div>

        

        {/* Footer */}
        <footer className="mt-32 bg-gradient-to-r from-gray-900 to-gray-800 text-white animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2 animate-fade-in">
                <div className="flex items-center mb-6">
                  <Building className="h-8 w-8 text-blue-400 mr-3" />
                  <h3 className="text-2xl font-bold">Smart PG Manager</h3>
                </div>
                <p className="text-gray-300 mb-6 max-w-md">
                  The most comprehensive solution for PG owners and tenants to manage properties, 
                  payments, and maintenance requests efficiently.
                </p>
                <div className="flex space-x-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-300">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-300">
                    <Zap className="h-5 w-5" />
                  </div>
                </div>
              </div>
              
              <div className="animate-fade-in-delay">
                <h4 className="text-lg font-semibold mb-4">Features</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>Property Management</li>
                  <li>Tenant Management</li>
                  <li>Billing & Payments</li>
                  <li>Maintenance Requests</li>
                </ul>
              </div>
              
              <div className="animate-fade-in-delay-2">
                <h4 className="text-lg font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>Help Center</li>
                  <li>Documentation</li>
                  <li>Contact Us</li>
                  <li>Privacy Policy</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400 animate-fade-in-delay-2">
              <p>&copy; 2024 Smart PG Manager. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
