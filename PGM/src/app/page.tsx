'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, BarChart3, Home as HomeIcon, ArrowRight, Star, CheckCircle, Shield, Zap, Globe, Menu, X, Building2, Receipt, Wrench, TrendingUp, Mail, Phone, MapPin, DollarSign, Clock, Lock, Smartphone, FileText, Settings, Bell, HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { StayTrackLogo } from '@/components/common/StayTrackLogo';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { addNotification } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Set hero section as visible immediately
    setVisibleSections((prev) => new Set(prev).add('hero'));

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections((prev) => new Set(prev).add(entry.target.id));
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  useEffect(() => {
    if (session) {
      setUser({
        id: session.user?.id || '',
        name: session.user?.name || '',
        email: session.user?.email || '',
        role: session.user?.role || 'TENANT',
      });

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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#0b3b5a]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation Header */}
      <header className="bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-800/20 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="flex justify-between items-center py-4">
            <StayTrackLogo size={32} color="#0b3b5a" showText={true} className="sm:w-auto" />
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('about')}
                className="text-gray-300 hover:text-[#0b3b5a] transition-colors duration-300 font-medium"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('services')}
                className="text-gray-300 hover:text-[#0b3b5a] transition-colors duration-300 font-medium"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-gray-300 hover:text-[#0b3b5a] transition-colors duration-300 font-medium"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-gray-300 hover:text-[#0b3b5a] transition-colors duration-300 font-medium"
              >
                Contact
              </button>
              <button
                onClick={() => scrollToSection('help')}
                className="text-gray-300 hover:text-[#0b3b5a] transition-colors duration-300 font-medium"
              >
                Help
              </button>
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/login">
                <Button variant="outline" className="border-[#0b3b5a] text-[#0b3b5a] hover:bg-[#0b3b5a] hover:text-white transition-all duration-300">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#0b3b5a] hover:bg-[#0a2f43] text-white transition-all duration-300">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-800">
              <nav className="flex flex-col space-y-4">
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-left text-gray-300 hover:text-[#0b3b5a] transition-colors duration-300 font-medium"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection('services')}
                  className="text-left text-gray-300 hover:text-[#0b3b5a] transition-colors duration-300 font-medium"
                >
                  Services
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="text-left text-gray-300 hover:text-[#0b3b5a] transition-colors duration-300 font-medium"
                >
                  Pricing
                </button>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="text-left text-gray-300 hover:text-[#0b3b5a] transition-colors duration-300 font-medium"
                >
                  Contact
                </button>
                <button
                  onClick={() => scrollToSection('help')}
                  className="text-left text-gray-300 hover:text-[#0b3b5a] transition-colors duration-300 font-medium"
                >
                  Help
                </button>
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-800">
                  <Link href="/login" className="w-full">
                    <Button variant="outline" className="w-full border-[#0b3b5a] text-[#0b3b5a] hover:bg-[#0b3b5a] hover:text-white">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" className="w-full">
                    <Button className="w-full bg-[#0b3b5a] hover:bg-[#0a2f43] text-white">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-12 sm:py-16 lg:py-20">
        <div className="text-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white">
              Modern PG Management
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0b3b5a] via-[#5c9fc9] to-[#0b3b5a] animate-gradient block sm:inline">
                {' '}with StayTrack
              </span>
            </h1>
          </div>
          
          <p className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl md:text-2xl text-gray-300 font-medium animate-fade-in-delay">
            Streamline your Paying Guest accommodation management with our comprehensive, 
            cloud-based solution designed for modern property owners and tenants.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-2">
            <Link href="/register" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-[#0b3b5a] hover:bg-[#0a2f43] text-white px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover-glow"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Link href="/login" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto border-2 border-[#0b3b5a] text-[#0b3b5a] hover:bg-[#0b3b5a] hover:text-white px-8 py-6 text-lg font-semibold transition-all duration-300 hover:scale-105 hover-glow"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-16 sm:py-20 lg:py-24">
        <div className={`text-center mb-12 transition-all duration-1000 ${visibleSections.has('about') ? 'animate-slide-in-up opacity-100' : 'opacity-100'}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            What is StayTrack?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            StayTrack is a comprehensive Property Management System (PGMS) specifically designed 
            for managing Paying Guest accommodations efficiently and professionally.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 mt-12">
          <Card className={`bg-gray-800/80 backdrop-blur-sm border-gray-700 hover-lift hover-glow transition-all duration-500 ${visibleSections.has('about') ? 'animate-slide-in-up stagger-1 opacity-100' : 'opacity-100'}`}>
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <Building2 className="h-8 w-8 text-[#0b3b5a] animate-pulse-slow" />
                What is This?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">
                StayTrack is a cloud-based property management platform that automates and simplifies 
                the entire lifecycle of PG accommodation management. From property registration to tenant 
                onboarding, billing, payments, and maintenance tracking - everything is managed through 
                a single, intuitive dashboard.
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-gray-800/80 backdrop-blur-sm border-gray-700 hover-lift hover-glow transition-all duration-500 ${visibleSections.has('about') ? 'animate-slide-in-up stagger-2 opacity-100' : 'opacity-100'}`}>
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <Users className="h-8 w-8 text-[#0b3b5a] animate-pulse-slow" />
                Who Can Use It?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong className="text-white">Property Owners:</strong> Manage multiple properties, 
                track occupancy, handle billing, and maintain tenant records effortlessly.
              </p>
              <p className="text-gray-300 leading-relaxed">
                <strong className="text-white">Tenants:</strong> View invoices, submit meter readings, 
                make payments, and raise maintenance requests through a user-friendly interface.
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-gray-800/80 backdrop-blur-sm border-gray-700 hover-lift hover-glow transition-all duration-500 ${visibleSections.has('about') ? 'animate-slide-in-up stagger-3 opacity-100' : 'opacity-100'}`}>
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <Zap className="h-8 w-8 text-[#0b3b5a] animate-pulse-slow" />
                Why Use StayTrack?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Eliminate manual paperwork and reduce administrative overhead by up to 80%</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Automated billing and payment tracking ensures zero revenue leakage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Real-time analytics help make data-driven decisions for your business</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Mobile-responsive design works seamlessly on all devices</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className={`bg-gray-800/80 backdrop-blur-sm border-gray-700 hover-lift hover-glow transition-all duration-500 ${visibleSections.has('about') ? 'animate-slide-in-up stagger-4 opacity-100' : 'opacity-100'}`}>
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <Star className="h-8 w-8 text-[#0b3b5a] animate-pulse-slow" />
                Key Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white">Time Savings:</strong> Reduce time spent on administrative tasks by 70%</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white">Accuracy:</strong> Automated calculations eliminate human errors</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white">Transparency:</strong> Real-time updates for both owners and tenants</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white">Scalability:</strong> Manage from 1 to 100+ properties effortlessly</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="bg-gray-800/30 py-16 sm:py-20 lg:py-24">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className={`text-center mb-12 transition-all duration-1000 ${visibleSections.has('services') ? 'animate-slide-in-up opacity-100' : 'opacity-100'}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Our Services
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
              Comprehensive features designed to handle every aspect of PG management
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Building2,
                title: "Property Management",
                description: "Register and manage multiple properties with detailed room and bed tracking. Monitor occupancy rates, amenities, and property-specific settings.",
                features: ["Multi-property support", "Room & bed allocation", "Occupancy tracking", "Amenities management"]
              },
              {
                icon: Users,
                title: "Tenant Management",
                description: "Complete tenant lifecycle management from onboarding to move-out. Store KYC documents, track lease agreements, and manage tenant profiles.",
                features: ["Tenant profiles", "KYC document storage", "Lease management", "Move-in/out tracking"]
              },
              {
                icon: Receipt,
                title: "Billing & Invoicing",
                description: "Automated monthly invoice generation combining rent, electricity, and other charges. Support for late fees and payment reminders.",
                features: ["Auto invoice generation", "Combined billing", "Late fee calculation", "Receipt generation"]
              },
              {
                icon: CreditCard,
                title: "Payment Processing",
                description: "Multiple payment methods including UPI, cards, net banking, and cash. Real-time payment tracking with automatic invoice updates.",
                features: ["UPI integration", "Multiple payment methods", "Payment history", "Auto status updates"]
              },
              {
                icon: BarChart3,
                title: "Electricity Management",
                description: "Image-based meter reading submission, automatic bill calculation, and approval workflow. Configurable billing settings per property.",
                features: ["Meter reading upload", "Auto calculation", "Approval workflow", "Bill tracking"]
              },
              {
                icon: Wrench,
                title: "Maintenance System",
                description: "Priority-based maintenance ticket system with status tracking. Enable tenants to raise requests and owners to track resolution.",
                features: ["Ticket creation", "Priority management", "Status tracking", "Notifications"]
              },
              {
                icon: TrendingUp,
                title: "Analytics & Reports",
                description: "Comprehensive reports on revenue, occupancy, payments, and tenant analytics. Visual charts and graphs for better insights.",
                features: ["Revenue reports", "Occupancy analytics", "Payment tracking", "Visual dashboards"]
              },
              {
                icon: Bell,
                title: "Notifications",
                description: "Real-time notifications for payments, maintenance requests, invoice due dates, and important updates for both owners and tenants.",
                features: ["Real-time alerts", "Email notifications", "In-app notifications", "Customizable preferences"]
              },
              {
                icon: Shield,
                title: "Security & Access",
                description: "Role-based access control with secure authentication. Separate dashboards for owners and tenants with appropriate permissions.",
                features: ["Role-based access", "Secure authentication", "Data encryption", "Privacy protection"]
              }
            ].map((service, index) => (
              <Card 
                key={index} 
                className={`bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:border-[#0b3b5a] hover-lift hover-glow transition-all duration-500 ${visibleSections.has('services') ? `animate-scale-in stagger-${(index % 9) + 1} opacity-100` : 'opacity-100'}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-[#0b3b5a]/20 rounded-lg flex items-center justify-center mb-4 hover-scale transition-transform duration-300">
                    <service.icon className="h-6 w-6 text-[#0b3b5a] animate-pulse-slow" />
                  </div>
                  <CardTitle className="text-xl text-white mb-2">
                    {service.title}
                  </CardTitle>
                  <CardDescription className="text-gray-300 leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-16 sm:py-20 lg:py-24">
          <div className={`text-center mb-12 transition-all duration-1000 ${visibleSections.has('pricing') ? 'animate-slide-in-up opacity-100' : 'opacity-100'}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the plan that fits your needs. All plans include core features with no hidden charges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {[
            {
              name: "Starter",
              price: "Free",
              period: "Forever",
              description: "Perfect for small PG owners getting started",
              features: [
                "Up to 1 property",
                "Up to 10 tenants",
                "Basic billing & invoicing",
                "Payment tracking",
                "Email support",
                "Mobile app access"
              ],
              popular: false
            },
            {
              name: "Professional",
              price: "₹999",
              period: "per month",
              description: "Ideal for growing property management businesses",
              features: [
                "Up to 5 properties",
                "Unlimited tenants",
                "Advanced analytics",
                "Maintenance system",
                "Priority support",
                "Custom reports",
                "API access"
              ],
              popular: true
            },
            {
              name: "Enterprise",
              price: "Custom",
              period: "pricing",
              description: "For large-scale property management operations",
              features: [
                "Unlimited properties",
                "Unlimited tenants",
                "White-label solution",
                "Dedicated support",
                "Custom integrations",
                "Advanced security",
                "SLA guarantee"
              ],
              popular: false
            }
          ].map((plan, index) => (
            <Card 
              key={index} 
              className={`bg-gray-800/80 backdrop-blur-sm border-2 hover-lift hover-glow transition-all duration-500 ${visibleSections.has('pricing') ? `animate-slide-in-up stagger-${index + 1} opacity-100` : 'opacity-100'} ${
                plan.popular 
                  ? 'border-[#0b3b5a] shadow-xl shadow-[#0b3b5a]/20 animate-glow' 
                  : 'border-gray-700'
              }`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {plan.popular && (
                <div className="bg-[#0b3b5a] text-white text-center py-2 text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white mb-2">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-400 ml-2">/{plan.period}</span>
                  )}
                </div>
                <CardDescription className="text-gray-300 mt-4">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-[#0b3b5a] hover:bg-[#0a2f43] text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-gray-800/30 py-16 sm:py-20 lg:py-24">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className={`text-center mb-12 transition-all duration-1000 ${visibleSections.has('contact') ? 'animate-slide-in-up opacity-100' : 'opacity-100'}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Get In Touch
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
              Have questions? We&apos;re here to help. Reach out to us through any of the channels below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            <Card className={`bg-gray-800/80 backdrop-blur-sm border-gray-700 text-center hover-lift hover-glow transition-all duration-500 ${visibleSections.has('contact') ? 'animate-slide-in-left stagger-1 opacity-100' : 'opacity-100'}`}>
              <CardHeader>
                <div className="w-16 h-16 bg-[#0b3b5a]/20 rounded-full flex items-center justify-center mx-auto mb-4 hover-scale transition-transform duration-300">
                  <Mail className="h-8 w-8 text-[#0b3b5a] animate-pulse-slow" />
                </div>
                <CardTitle className="text-xl text-white">Email Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">support@staytrack.com</p>
                <p className="text-gray-300 mt-2">info@staytrack.com</p>
              </CardContent>
            </Card>

            <Card className={`bg-gray-800/80 backdrop-blur-sm border-gray-700 text-center hover-lift hover-glow transition-all duration-500 ${visibleSections.has('contact') ? 'animate-scale-in stagger-2 opacity-100' : 'opacity-100'}`}>
              <CardHeader>
                <div className="w-16 h-16 bg-[#0b3b5a]/20 rounded-full flex items-center justify-center mx-auto mb-4 hover-scale transition-transform duration-300">
                  <Phone className="h-8 w-8 text-[#0b3b5a] animate-pulse-slow" />
                </div>
                <CardTitle className="text-xl text-white">Call Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">+91 1800-XXX-XXXX</p>
                <p className="text-gray-300 mt-2">Mon - Fri, 9 AM - 6 PM IST</p>
              </CardContent>
            </Card>

            <Card className={`bg-gray-800/80 backdrop-blur-sm border-gray-700 text-center hover-lift hover-glow transition-all duration-500 ${visibleSections.has('contact') ? 'animate-slide-in-right stagger-3 opacity-100' : 'opacity-100'}`}>
              <CardHeader>
                <div className="w-16 h-16 bg-[#0b3b5a]/20 rounded-full flex items-center justify-center mx-auto mb-4 hover-scale transition-transform duration-300">
                  <MapPin className="h-8 w-8 text-[#0b3b5a] animate-pulse-slow" />
                </div>
                <CardTitle className="text-xl text-white">Visit Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">123 Business Street</p>
                <p className="text-gray-300 mt-2">Mumbai, Maharashtra 400001</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Help/FAQ Section */}
      <section id="help" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-16 sm:py-20 lg:py-24">
          <div className={`text-center mb-12 transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up opacity-100' : 'opacity-100'}`}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="h-10 w-10 text-[#0b3b5a] animate-pulse-slow" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Help Center
            </h2>
          </div>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Find answers to common questions and get help when you need it
          </p>
        </div>

        {/* Search Bar */}
        <div className={`max-w-2xl mx-auto mb-12 transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up opacity-100' : 'opacity-100'}`}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-800/80 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b3b5a] focus:border-transparent transition-all duration-300"
            />
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Getting Started */}
          <div className={`transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up stagger-1 opacity-100' : 'opacity-100'}`}>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="h-6 w-6 text-[#0b3b5a]" />
              Getting Started
            </h3>
            <div className="space-y-3">
              {[
                {
                  q: "How do I create an account?",
                  a: "Click on the 'Get Started' or 'Register' button on the homepage. Fill in your details including name, email, password, and select your role (Owner or Tenant). After registration, you'll receive a confirmation email."
                },
                {
                  q: "What's the difference between Owner and Tenant accounts?",
                  a: "Owners can manage properties, tenants, billing, and view analytics. Tenants can view their invoices, submit meter readings, make payments, and raise maintenance requests. Each role has access to features specific to their needs."
                },
                {
                  q: "How do I add my first property?",
                  a: "After logging in as an Owner, go to the Properties section and click 'Add New Property'. Fill in the property details including name, address, amenities, and number of rooms/beds. You can add multiple properties to manage them all from one dashboard."
                }
              ].filter(faq => 
                searchQuery === '' || 
                faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                faq.a.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((faq, index) => (
                <Card 
                  key={index}
                  className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover-lift transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-700/50 transition-colors rounded-lg"
                  >
                    <span className="text-white font-semibold pr-4">{faq.q}</span>
                    {openFAQ === index ? (
                      <ChevronUp className="h-5 w-5 text-[#0b3b5a] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFAQ === index && (
                    <div className="px-4 pb-4 animate-slide-in-up">
                      <p className="text-gray-300 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Property Management */}
          <div className={`transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up stagger-2 opacity-100' : 'opacity-100'}`}>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-[#0b3b5a]" />
              Property Management
            </h3>
            <div className="space-y-3">
              {[
                {
                  q: "How do I add rooms and beds to a property?",
                  a: "Go to the Properties section, select a property, and click on 'Add Room'. Specify the room number and number of beds. You can add multiple rooms at once. Each bed can be assigned to a tenant later."
                },
                {
                  q: "Can I manage multiple properties?",
                  a: "Yes! StayTrack supports managing multiple properties from a single dashboard. You can switch between properties, view property-specific analytics, and manage tenants across all your properties."
                },
                {
                  q: "How do I track occupancy rates?",
                  a: "The dashboard automatically calculates occupancy rates for each property. You can view this in the Properties section or in the Analytics/Reports section. It shows the percentage of occupied beds vs total available beds."
                }
              ].filter(faq => 
                searchQuery === '' || 
                faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                faq.a.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((faq, index) => {
                const faqIndex = 3 + index;
                return (
                  <Card 
                    key={faqIndex}
                    className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover-lift transition-all duration-300"
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === faqIndex ? null : faqIndex)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-700/50 transition-colors rounded-lg"
                    >
                      <span className="text-white font-semibold pr-4">{faq.q}</span>
                      {openFAQ === faqIndex ? (
                        <ChevronUp className="h-5 w-5 text-[#0b3b5a] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {openFAQ === faqIndex && (
                      <div className="px-4 pb-4 animate-slide-in-up">
                        <p className="text-gray-300 leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Billing & Payments */}
          <div className={`transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up stagger-3 opacity-100' : 'opacity-100'}`}>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-[#0b3b5a]" />
              Billing & Payments
            </h3>
            <div className="space-y-3">
              {[
                {
                  q: "How are invoices generated?",
                  a: "Invoices are automatically generated monthly for each tenant. They include rent, electricity charges (based on meter readings), and any other charges. You can view and download invoices from the Billing section."
                },
                {
                  q: "How do I submit electricity meter readings?",
                  a: "As a tenant, go to the Electricity section, click 'Submit Reading', upload a photo of your meter, and enter the reading. The system will calculate your bill automatically. Owners can approve or reject readings."
                },
                {
                  q: "What payment methods are supported?",
                  a: "StayTrack supports multiple payment methods including UPI, Credit/Debit Cards, Net Banking, Digital Wallets, and Cash. Payments are tracked automatically and invoices are updated in real-time."
                },
                {
                  q: "How do I pay my rent?",
                  a: "Go to the Billing section, select an unpaid invoice, and click 'Pay Now'. Choose your preferred payment method and complete the transaction. You'll receive a payment confirmation and receipt."
                }
              ].filter(faq => 
                searchQuery === '' || 
                faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                faq.a.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((faq, index) => {
                const faqIndex = 6 + index;
                return (
                  <Card 
                    key={faqIndex}
                    className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover-lift transition-all duration-300"
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === faqIndex ? null : faqIndex)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-700/50 transition-colors rounded-lg"
                    >
                      <span className="text-white font-semibold pr-4">{faq.q}</span>
                      {openFAQ === faqIndex ? (
                        <ChevronUp className="h-5 w-5 text-[#0b3b5a] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {openFAQ === faqIndex && (
                      <div className="px-4 pb-4 animate-slide-in-up">
                        <p className="text-gray-300 leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Tenant Management */}
          <div className={`transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up stagger-4 opacity-100' : 'opacity-100'}`}>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="h-6 w-6 text-[#0b3b5a]" />
              Tenant Management
            </h3>
            <div className="space-y-3">
              {[
                {
                  q: "How do I add a new tenant?",
                  a: "Go to the Tenants section and click 'Add Tenant'. Fill in tenant details including name, email, phone, and upload KYC documents. Assign them to a property and room. The tenant will receive login credentials via email."
                },
                {
                  q: "What KYC documents are required?",
                  a: "Typically, you'll need Aadhaar card, PAN card, and a photo ID. The system allows you to upload and store these documents securely. Both owners and tenants can access these documents when needed."
                },
                {
                  q: "How do I assign a tenant to a room?",
                  a: "When adding or editing a tenant, select the property and room from the dropdown menus. The system will automatically update bed availability. You can also move tenants between rooms if needed."
                }
              ].filter(faq => 
                searchQuery === '' || 
                faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                faq.a.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((faq, index) => {
                const faqIndex = 10 + index;
                return (
                  <Card 
                    key={faqIndex}
                    className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover-lift transition-all duration-300"
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === faqIndex ? null : faqIndex)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-700/50 transition-colors rounded-lg"
                    >
                      <span className="text-white font-semibold pr-4">{faq.q}</span>
                      {openFAQ === faqIndex ? (
                        <ChevronUp className="h-5 w-5 text-[#0b3b5a] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {openFAQ === faqIndex && (
                      <div className="px-4 pb-4 animate-slide-in-up">
                        <p className="text-gray-300 leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Maintenance */}
          <div className={`transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up stagger-5 opacity-100' : 'opacity-100'}`}>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Wrench className="h-6 w-6 text-[#0b3b5a]" />
              Maintenance Requests
            </h3>
            <div className="space-y-3">
              {[
                {
                  q: "How do I raise a maintenance request?",
                  a: "As a tenant, go to the Requests section and click 'Create Request'. Describe the issue, select priority (Low, Medium, High, Urgent), and submit. You'll receive updates on the status of your request."
                },
                {
                  q: "How do I track maintenance requests?",
                  a: "Both owners and tenants can view all maintenance requests in the Requests section. You can filter by status (Open, In Progress, Resolved, Closed) and priority. Owners can update the status and assign tasks."
                }
              ].filter(faq => 
                searchQuery === '' || 
                faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                faq.a.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((faq, index) => {
                const faqIndex = 13 + index;
                return (
                  <Card 
                    key={faqIndex}
                    className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover-lift transition-all duration-300"
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === faqIndex ? null : faqIndex)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-700/50 transition-colors rounded-lg"
                    >
                      <span className="text-white font-semibold pr-4">{faq.q}</span>
                      {openFAQ === faqIndex ? (
                        <ChevronUp className="h-5 w-5 text-[#0b3b5a] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {openFAQ === faqIndex && (
                      <div className="px-4 pb-4 animate-slide-in-up">
                        <p className="text-gray-300 leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* General */}
          <div className={`transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up stagger-6 opacity-100' : 'opacity-100'}`}>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-[#0b3b5a]" />
              General Questions
            </h3>
            <div className="space-y-3">
              {[
                {
                  q: "Is my data secure?",
                  a: "Yes, StayTrack uses industry-standard encryption and security measures to protect your data. We follow best practices for data privacy and comply with relevant data protection regulations."
                },
                {
                  q: "Can I access StayTrack on mobile?",
                  a: "Yes! StayTrack is fully responsive and works seamlessly on mobile devices, tablets, and desktops. You can access all features from any device with an internet connection."
                },
                {
                  q: "What if I need additional help?",
                  a: "If you can't find the answer here, you can contact our support team via email (support@staytrack.com) or phone (+91 1800-XXX-XXXX). We're available Monday to Friday, 9 AM to 6 PM IST."
                },
                {
                  q: "Is there a mobile app?",
                  a: "Currently, StayTrack is accessible through web browsers on all devices. A dedicated mobile app is in development and will be available soon. The web version is fully optimized for mobile use."
                }
              ].filter(faq => 
                searchQuery === '' || 
                faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                faq.a.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((faq, index) => {
                const faqIndex = 15 + index;
                return (
                  <Card 
                    key={faqIndex}
                    className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover-lift transition-all duration-300"
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === faqIndex ? null : faqIndex)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-700/50 transition-colors rounded-lg"
                    >
                      <span className="text-white font-semibold pr-4">{faq.q}</span>
                      {openFAQ === faqIndex ? (
                        <ChevronUp className="h-5 w-5 text-[#0b3b5a] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {openFAQ === faqIndex && (
                      <div className="px-4 pb-4 animate-slide-in-up">
                        <p className="text-gray-300 leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Still Need Help */}
        <div className={`max-w-2xl mx-auto mt-16 text-center transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up opacity-100' : 'opacity-100'}`}>
          <Card className="bg-gradient-to-r from-[#0b3b5a]/20 to-[#5c9fc9]/20 border-[#0b3b5a]">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Still Need Help?</h3>
              <p className="text-gray-300 mb-6">
                Can&apos;t find what you&apos;re looking for? Our support team is here to help you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => scrollToSection('contact')}
                  className="bg-[#0b3b5a] hover:bg-[#0a2f43] text-white hover-glow"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
                <Link href="/register">
                  <Button 
                    variant="outline"
                    className="border-[#0b3b5a] text-[#0b3b5a] hover:bg-[#0b3b5a] hover:text-white"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="sm:col-span-2">
              <div className="mb-6">
                <StayTrackLogo size={32} color="#ffffff" textColor="#ffffff" showText={true} />
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                StayTrack is a modern PG management system designed to streamline property operations, 
                tenant management, and financial tracking for accommodation providers.
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
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Features</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Property Management</li>
                <li>Tenant Management</li>
                <li>Billing & Payments</li>
                <li>Maintenance Requests</li>
                <li>Analytics & Reports</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 StayTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
