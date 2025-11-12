'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, BarChart3, Home as HomeIcon, ArrowRight, Star, CheckCircle, Shield, Zap, Globe } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ClientOnly } from '@/components/common/ClientOnly';
import { StayTrackLogo } from '@/components/common/StayTrackLogo';
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#0b3b5a]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-md shadow-lg border-b border-gray-800/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <StayTrackLogo size={32} color="#0b3b5a" showText={true} className="sm:w-auto" />
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link href="/login">
                <Button variant="outline" className="hidden sm:block border-[#0b3b5a] text-[#0b3b5a] hover:bg-[#0b3b5a] hover:text-white transition-all duration-300 hover:scale-105 text-sm sm:text-base px-3 sm:px-4">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="hidden sm:block bg-[#0b3b5a] hover:bg-[#0a2f43] text-white transition-all duration-300 hover:scale-105 text-sm sm:text-base px-3 sm:px-4">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center">
          <div className="animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white px-4">
              Modern PG Management
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0b3b5a] via-[#5c9fc9] to-[#0b3b5a] animate-gradient">
                {" "}with StayTrack
              </span>
          </h1>
          </div>
          
          <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 px-4 animate-fade-in-delay font-semibold">
            A modern PG management system for efficiently managing tenants, rent, 
            and utilities with ease.
          </p>
          
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 animate-fade-in-delay-2">
            <Link href="/register" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-[#0b3b5a] hover:bg-[#0a2f43] text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Get Started 
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            
            <Link href="/login" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto border-2 border-[#0b3b5a] text-[#0b3b5a] hover:bg-[#0b3b5a] hover:text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 sm:mt-24 lg:mt-32">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16 px-4 animate-fade-in">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              Why Choose StayTrack?
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto font-semibold">
              Powerful features designed to streamline your PG management experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                icon: HomeIcon,
                title: "Property Management",
                description: "Manage multiple properties, rooms, and beds with ease",
                color: "text-[#0b3b5a]",
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
                color: "text-[#0b3b5a]", 
                bgColor: "bg-cyan-50"
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
                <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gray-800/80 backdrop-blur-sm hover:-translate-y-2">
                  <CardHeader className="text-center p-4 sm:p-6 lg:p-8">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 ${feature.bgColor} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-base sm:text-lg lg:text-xl font-bold text-white mb-2 sm:mb-3">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base text-gray-300 leading-relaxed font-medium px-2 sm:px-0">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            ))}
          </div>
        </div>

        

        {/* Footer */}
        <footer className="mt-16 sm:mt-24 lg:mt-32 bg-gradient-to-r from-gray-900 to-gray-800 text-white animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              <div className="sm:col-span-2 animate-fade-in">
                <div className="mb-4 sm:mb-6">
                  <StayTrackLogo size={32} color="#ffffff" textColor="#ffffff" showText={true} className="sm:w-auto" />
                </div>
                <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 max-w-md">
                  StayTrack is a modern PG management system for efficiently managing tenants, rent, 
                  and utilities. The comprehensive solution for PG owners.
                </p>
                <div className="flex space-x-4">
                  <div className="w-10 h-10 bg-[#0b3b5a] rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-300">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="w-10 h-10 bg-[#5c9fc9] rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-300">
                    <Zap className="h-5 w-5" />
                  </div>
                </div>
              </div>
              
              <div className="animate-fade-in-delay">
                <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Features</h4>
                <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-300">
                  <li>Property Management</li>
                  <li>Tenant Management</li>
                  <li>Billing & Payments</li>
                  <li>Maintenance Requests</li>
                </ul>
              </div>
              
              <div className="animate-fade-in-delay-2">
                <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Support</h4>
                <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-300">
                  <li>Help Center</li>
                  <li>Documentation</li>
                  <li>Contact Us</li>
                  <li>Privacy Policy</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-700 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-sm sm:text-base text-gray-400 animate-fade-in-delay-2">
              <p>&copy; 2024 StayTrack. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
