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
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['getting-started'])); // Default: first category open

  useEffect(() => {
    // Set hero section as visible immediately
    setVisibleSections((prev) => new Set(prev).add('hero'));
    
    // Check which section is currently in view on mount
    const checkInitialSection = () => {
      const sections = document.querySelectorAll('section[id]');
      const navHeight = 80; // Height of navbar
      
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= navHeight + 100 && rect.bottom >= navHeight) {
          setActiveSection(section.id);
        }
      });
    };
    
    // Small delay to ensure DOM is ready
    setTimeout(checkInitialSection, 100);

    const observerOptions = {
      threshold: 0.3,
      rootMargin: '-80px 0px -50% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          // Update active section when it comes into view
          setActiveSection(entry.target.id);
          console.log('Active section changed to:', entry.target.id);
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  // Debug: Log when active section changes
  useEffect(() => {
    console.log('Active section state updated to:', activeSection);
  }, [activeSection]);

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
    console.log('Scrolling to section:', id);
    const element = document.getElementById(id);
    if (element) {
      setActiveSection(id); // Set active section immediately on click
      console.log('Active section set to:', id);
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    } else {
      console.warn('Section not found:', id);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0d0d]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-[#f5c518]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Navigation Header */}
      <header className="bg-[#0d0d0d]/95 backdrop-blur-md shadow-lg border-b border-[#333333]/20 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="flex justify-between items-center py-4">
            <StayTrackLogo size={32} color="#f5c518" showText={true} className="sm:w-auto" />
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('about')}
                className={`relative pb-1 font-semibold transition-colors duration-300 ${
                  activeSection === 'about' 
                    ? 'text-[#f5c518]' 
                    : 'text-[#a1a1a1] hover:text-[#f5c518]'
                }`}
              >
                About
                {activeSection === 'about' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#f5c518] shadow-[0_0_8px_rgba(245,197,24,0.6)] animate-fade-in" />
                )}
              </button>
              <button
                onClick={() => scrollToSection('services')}
                className={`relative pb-1 font-semibold transition-colors duration-300 ${
                  activeSection === 'services' 
                    ? 'text-[#f5c518]' 
                    : 'text-[#a1a1a1] hover:text-[#f5c518]'
                }`}
              >
                Services
                {activeSection === 'services' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#f5c518] shadow-[0_0_8px_rgba(245,197,24,0.6)] animate-fade-in" />
                )}
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className={`relative pb-1 font-semibold transition-colors duration-300 ${
                  activeSection === 'pricing' 
                    ? 'text-[#f5c518]' 
                    : 'text-[#a1a1a1] hover:text-[#f5c518]'
                }`}
              >
                Pricing
                {activeSection === 'pricing' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#f5c518] shadow-[0_0_8px_rgba(245,197,24,0.6)] animate-fade-in" />
                )}
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className={`relative pb-1 font-semibold transition-colors duration-300 ${
                  activeSection === 'contact' 
                    ? 'text-[#f5c518]' 
                    : 'text-[#a1a1a1] hover:text-[#f5c518]'
                }`}
              >
                Contact
                {activeSection === 'contact' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#f5c518] shadow-[0_0_8px_rgba(245,197,24,0.6)] animate-fade-in" />
                )}
              </button>
              <button
                onClick={() => scrollToSection('help')}
                className={`relative pb-1 font-semibold transition-colors duration-300 ${
                  activeSection === 'help' 
                    ? 'text-[#f5c518]' 
                    : 'text-[#a1a1a1] hover:text-[#f5c518]'
                }`}
              >
                Help
                {activeSection === 'help' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#f5c518] shadow-[0_0_8px_rgba(245,197,24,0.6)] animate-fade-in" />
                )}
              </button>
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/login">
                <Button variant="outline" magnetic>
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button magnetic>
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-[#a1a1a1] hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-[#333333]">
              <nav className="flex flex-col space-y-4">
                <button
                  onClick={() => scrollToSection('about')}
                  className={`text-left font-semibold transition-colors duration-300 flex items-center justify-between pb-2 border-b ${
                    activeSection === 'about' 
                      ? 'text-[#f5c518] border-[#f5c518]' 
                      : 'text-[#a1a1a1] hover:text-[#f5c518] border-transparent'
                  }`}
                >
                  About
                  {activeSection === 'about' && (
                    <span className="w-2 h-2 bg-[#f5c518] rounded-full shadow-[0_0_8px_rgba(245,197,24,0.8)] animate-pulse-slow" />
                  )}
                </button>
                <button
                  onClick={() => scrollToSection('services')}
                  className={`text-left font-semibold transition-colors duration-300 flex items-center justify-between pb-2 border-b ${
                    activeSection === 'services' 
                      ? 'text-[#f5c518] border-[#f5c518]' 
                      : 'text-[#a1a1a1] hover:text-[#f5c518] border-transparent'
                  }`}
                >
                  Services
                  {activeSection === 'services' && (
                    <span className="w-2 h-2 bg-[#f5c518] rounded-full shadow-[0_0_8px_rgba(245,197,24,0.8)] animate-pulse-slow" />
                  )}
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className={`text-left font-semibold transition-colors duration-300 flex items-center justify-between pb-2 border-b ${
                    activeSection === 'pricing' 
                      ? 'text-[#f5c518] border-[#f5c518]' 
                      : 'text-[#a1a1a1] hover:text-[#f5c518] border-transparent'
                  }`}
                >
                  Pricing
                  {activeSection === 'pricing' && (
                    <span className="w-2 h-2 bg-[#f5c518] rounded-full shadow-[0_0_8px_rgba(245,197,24,0.8)] animate-pulse-slow" />
                  )}
                </button>
                <button
                  onClick={() => scrollToSection('contact')}
                  className={`text-left font-semibold transition-colors duration-300 flex items-center justify-between pb-2 border-b ${
                    activeSection === 'contact' 
                      ? 'text-[#f5c518] border-[#f5c518]' 
                      : 'text-[#a1a1a1] hover:text-[#f5c518] border-transparent'
                  }`}
                >
                  Contact
                  {activeSection === 'contact' && (
                    <span className="w-2 h-2 bg-[#f5c518] rounded-full shadow-[0_0_8px_rgba(245,197,24,0.8)] animate-pulse-slow" />
                  )}
                </button>
                <button
                  onClick={() => scrollToSection('help')}
                  className={`text-left font-semibold transition-colors duration-300 flex items-center justify-between pb-2 border-b ${
                    activeSection === 'help' 
                      ? 'text-[#f5c518] border-[#f5c518]' 
                      : 'text-[#a1a1a1] hover:text-[#f5c518] border-transparent'
                  }`}
                >
                  Help
                  {activeSection === 'help' && (
                    <span className="w-2 h-2 bg-[#f5c518] rounded-full shadow-[0_0_8px_rgba(245,197,24,0.8)] animate-pulse-slow" />
                  )}
                </button>
                <div className="flex flex-col space-y-2 pt-4 border-t border-[#333333]">
                  <Link href="/login" className="w-full">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" className="w-full">
                    <Button className="w-full">
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
      <section id="hero" className="w-full px-3 sm:px-6 lg:px-12 xl:px-16 py-10 sm:py-16 lg:py-20 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-[#f5c518]/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-[#f5c518]/5 rounded-full blur-2xl animate-float-slow"></div>
          <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-[#f5c518]/10 rounded-full blur-3xl animate-float"></div>
        </div>
        
        <div className="text-center relative z-10 max-w-7xl mx-auto">
          <div className="animate-fade-in-up">
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight break-words px-2">
              Modern PG Management
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f5c518] via-[#ffd000] to-[#f5c518] animate-gradient block mt-2 sm:mt-0 sm:inline">
                {' '}with StayTrack
              </span>
            </h1>
          </div>
          
          <p className="mt-4 sm:mt-6 max-w-3xl mx-auto text-base sm:text-lg md:text-xl lg:text-2xl text-[#e5e5e5] font-medium animate-fade-in-up stagger-1 px-2 leading-relaxed">
            Streamline your Paying Guest accommodation management with our comprehensive, 
            cloud-based solution designed for modern property owners and tenants.
          </p>
          
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center animate-fade-in-up stagger-2 px-2">
            <Link href="/register" className="w-full sm:w-auto max-w-xs sm:max-w-none">
              <Button 
                size="lg" 
                magnetic
                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl group"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Link href="/login" className="w-full sm:w-auto max-w-xs sm:max-w-none">
              <Button 
                variant="outline" 
                size="lg"
                magnetic
                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="w-full px-3 sm:px-6 lg:px-12 xl:px-16 py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className={`text-center mb-8 sm:mb-12 px-2 transition-all duration-1000 ${visibleSections.has('about') ? 'animate-slide-in-up opacity-100' : 'opacity-100'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
            What is StayTrack?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            StayTrack is a comprehensive Property Management System (PGMS) specifically designed 
            for managing Paying Guest accommodations efficiently and professionally.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 xl:gap-12 mt-8 sm:mt-12">
          <Card glow className={`${visibleSections.has('about') ? 'animate-slide-in-up stagger-1 opacity-100' : 'opacity-100'}`}>
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <Building2 className="h-8 w-8 text-[#f5c518] animate-pulse-slow" />
                What is This?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#e5e5e5] leading-relaxed">
                StayTrack is a cloud-based property management platform that automates and simplifies 
                the entire lifecycle of PG accommodation management. From property registration to tenant 
                onboarding, billing, payments, and maintenance tracking - everything is managed through 
                a single, intuitive dashboard.
              </p>
            </CardContent>
          </Card>

          <Card glow className={`${visibleSections.has('about') ? 'animate-slide-in-up stagger-2 opacity-100' : 'opacity-100'}`}>
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <Users className="h-8 w-8 text-[#f5c518] animate-pulse-slow" />
                Who Can Use It?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#e5e5e5] leading-relaxed mb-4">
                <strong className="text-[#f5c518]">Property Owners:</strong> Manage multiple properties, 
                track occupancy, handle billing, and maintain tenant records effortlessly.
              </p>
              <p className="text-[#e5e5e5] leading-relaxed">
                <strong className="text-[#f5c518]">Tenants:</strong> View invoices, submit meter readings, 
                make payments, and raise maintenance requests through a user-friendly interface.
              </p>
            </CardContent>
          </Card>

          <Card glow className={`${visibleSections.has('about') ? 'animate-slide-in-up stagger-3 opacity-100' : 'opacity-100'}`}>
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <Zap className="h-8 w-8 text-[#f5c518] animate-pulse-slow" />
                Why Use StayTrack?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-[#e5e5e5]">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                  <span>Eliminate manual paperwork and reduce administrative overhead by up to 80%</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                  <span>Automated billing and payment tracking ensures zero revenue leakage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                  <span>Real-time analytics help make data-driven decisions for your business</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                  <span>Mobile-responsive design works seamlessly on all devices</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card glow className={`${visibleSections.has('about') ? 'animate-slide-in-up stagger-4 opacity-100' : 'opacity-100'}`}>
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <Star className="h-8 w-8 text-[#f5c518] animate-pulse-slow" />
                Key Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-[#e5e5e5]">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                  <span><strong className="text-[#f5c518]">Time Savings:</strong> Reduce time spent on administrative tasks by 70%</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                  <span><strong className="text-[#f5c518]">Accuracy:</strong> Automated calculations eliminate human errors</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                  <span><strong className="text-[#f5c518]">Transparency:</strong> Real-time updates for both owners and tenants</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                  <span><strong className="text-[#f5c518]">Scalability:</strong> Manage from 1 to 100+ properties effortlessly</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="bg-[#1a1a1a]/30 py-12 sm:py-16 lg:py-20 xl:py-24 overflow-hidden">
        <div className="w-full">
          <div className={`text-center mb-8 sm:mb-12 px-3 sm:px-6 lg:px-12 xl:px-16 transition-all duration-1000 ${visibleSections.has('services') ? 'animate-slide-in-up opacity-100' : 'opacity-100'}`}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              Our Premium Services
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Comprehensive features designed to handle every aspect of PG management
            </p>
          </div>

          {/* Infinite Carousel */}
          <div className="services-carousel">
            <div className="carousel-track">
              {/* Duplicate the array twice for seamless infinite scroll */}
              {[...Array(2)].flatMap(() => [
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
              ]).map((service, index) => (
                <div 
                  key={index}
                  className="carousel-card"
                >
                  <div className="carousel-card-icon">
                    <service.icon />
                  </div>
                  <h3 className="carousel-card-title">
                    {service.title}
                  </h3>
                  <p className="carousel-card-description">
                    {service.description}
                  </p>
                  <div className="carousel-card-features">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="carousel-card-feature">
                        <CheckCircle />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full px-3 sm:px-6 lg:px-12 xl:px-16 py-12 sm:py-16 lg:py-20 xl:py-24">
          <div className={`text-center mb-8 sm:mb-12 px-2 transition-all duration-1000 ${visibleSections.has('pricing') ? 'animate-slide-in-up opacity-100' : 'opacity-100'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Choose the plan that fits your needs. All plans include core features with no hidden charges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 xl:gap-10">
          {[
            {
              name: "Starter",
              subtitle: "Essential PG",
              price: "₹999",
              period: "per month",
              yearlyPrice: "₹9,999/year (2 months free)",
              description: "1–20 rooms, single-property owners jo basic digitization chahte hain",
              features: [
                "Tenant & owner profiles",
                "Rent ledger (per tenant) + automated payment reminders",
                "Single-click receipt generation (PDF)",
                "Basic reports: monthly collection, due list",
                "Mobile-friendly UI (owner & manager access)",
                "Email + chat support (business hours)",
                "1 hour demo + 1 free data import (CSV)",
                "7 din free trial"
              ],
              popular: false
            },
            {
              name: "Growth",
              subtitle: "Pro PG",
              price: "₹2,499",
              period: "per month",
              yearlyPrice: "₹24,990/year",
              description: "21–100 rooms, multi-wing properties, managed by small staff",
              features: [
                "All Starter features included",
                "Multi-property & multi-wing support",
                "Advanced payments: UPI/bank integration, partial payments",
                "Auto rent-splitting, late-fee rules, security deposit ledger",
                "Smart vacancy tracker + tenant onboarding checklist",
                "Advanced reports & export (Excel/PDF)",
                "Monthly statement email to owner",
                "1 hour onboarding + 2 training sessions",
                "Email, chat, phone support (priority)",
                "30-day free pilot available"
              ],
              popular: true
            },
            {
              name: "Enterprise",
              subtitle: "Scale PG / Campus",
              price: "₹7,999+",
              period: "per month",
              yearlyPrice: "Custom pricing (annual contract recommended)",
              description: "100+ beds, multiple properties, co-living operators / hostels / campuses",
              features: [
                "All Growth features included",
                "Role-based access (manager, accountant, receptionist)",
                "API access, custom reports, payroll integration",
                "GST-ready billing",
                "Lease & contract lifecycle (renewal alerts, e-sign ready)",
                "Collection agents module, bulk invoicing, refund workflows",
                "Dedicated account manager + 24/7 phone support + SLA",
                "On-site setup (optional) + staff training",
                "1–2 week professional onboarding & data migration",
                "White-label, analytics dashboard available"
              ],
              popular: false
            }
          ].map((plan, index) => (
            <Card 
              key={index}
              glow={plan.popular}
              className={`flex flex-col ${visibleSections.has('pricing') ? `animate-slide-in-up stagger-${index + 1} opacity-100` : 'opacity-100'} ${
                plan.popular 
                  ? 'border-2 border-[#f5c518] shadow-xl shadow-[#f5c518]/20 relative' 
                  : ''
              }`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-[#f5c518] to-[#ffd000] text-[#0d0d0d] text-center py-2 text-sm font-bold">
                  Recommended ⭐
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white mb-1">{plan.name}</CardTitle>
                <p className="text-sm text-[#f5c518] font-semibold mb-3">{plan.subtitle}</p>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="text-[#a1a1a1] ml-2">/{plan.period}</span>
                  )}
                </div>
                <p className="text-xs text-[#10b981] mt-2 font-medium">{plan.yearlyPrice}</p>
                <CardDescription className="text-[#e5e5e5] mt-4 text-sm leading-relaxed">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col pt-4 pb-6 px-4">
                <ul className="space-y-2.5 mb-6 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[#e5e5e5] text-sm leading-relaxed">
                      <CheckCircle className="h-4 w-4 text-[#10b981] mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={plan.popular ? 'default' : 'secondary'}
                  className="w-90 mt-auto"
                  magnetic
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-[#1a1a1a]/30 py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="w-full px-3 sm:px-6 lg:px-12 xl:px-16">
          <div className={`text-center mb-8 sm:mb-12 px-2 transition-all duration-1000 ${visibleSections.has('contact') ? 'animate-slide-in-up opacity-100' : 'opacity-100'}`}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              Get In Touch
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#e5e5e5] max-w-3xl mx-auto leading-relaxed">
              Have questions? We&apos;re here to help. Reach out to us through any of the channels below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            <Card glow className={`text-center ${visibleSections.has('contact') ? 'animate-slide-in-left stagger-1 opacity-100' : 'opacity-100'}`}>
              <CardHeader>
                <div className="w-16 h-16 bg-[#f5c518]/10 rounded-full flex items-center justify-center mx-auto mb-4 hover-scale transition-transform duration-300 border border-[#f5c518]/20">
                  <Mail className="h-8 w-8 text-[#f5c518] animate-pulse-slow" />
                </div>
                <CardTitle className="text-xl text-white">Email Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#e5e5e5]">support@staytrack.com</p>
                <p className="text-[#e5e5e5] mt-2">info@staytrack.com</p>
              </CardContent>
            </Card>

            <Card glow className={`text-center ${visibleSections.has('contact') ? 'animate-scale-in stagger-2 opacity-100' : 'opacity-100'}`}>
              <CardHeader>
                <div className="w-16 h-16 bg-[#f5c518]/10 rounded-full flex items-center justify-center mx-auto mb-4 hover-scale transition-transform duration-300 border border-[#f5c518]/20">
                  <Phone className="h-8 w-8 text-[#f5c518] animate-pulse-slow" />
                </div>
                <CardTitle className="text-xl text-white">Call Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#e5e5e5]">+91 1800-XXX-XXXX</p>
                <p className="text-[#e5e5e5] mt-2">Mon - Fri, 9 AM - 6 PM IST</p>
              </CardContent>
            </Card>

            <Card glow className={`text-center ${visibleSections.has('contact') ? 'animate-slide-in-right stagger-3 opacity-100' : 'opacity-100'}`}>
              <CardHeader>
                <div className="w-16 h-16 bg-[#f5c518]/10 rounded-full flex items-center justify-center mx-auto mb-4 hover-scale transition-transform duration-300 border border-[#f5c518]/20">
                  <MapPin className="h-8 w-8 text-[#f5c518] animate-pulse-slow" />
                </div>
                <CardTitle className="text-xl text-white">Visit Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#e5e5e5]">123 Business Street</p>
                <p className="text-[#e5e5e5] mt-2">Mumbai, Maharashtra 400001</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Help/FAQ Section */}
      <section id="help" className="w-full px-3 sm:px-6 lg:px-12 xl:px-16 py-12 sm:py-16 lg:py-20 xl:py-24">
          <div className={`text-center mb-8 sm:mb-12 px-2 transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up opacity-100' : 'opacity-100'}`}>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <HelpCircle className="h-8 w-8 sm:h-10 sm:w-10 text-[#f5c518] animate-pulse-slow" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Help Center
            </h2>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Find answers to common questions and get help when you need it
          </p>
        </div>

        {/* Search Bar */}
        <div className={`max-w-2xl mx-auto mb-8 sm:mb-12 px-2 transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up opacity-100' : 'opacity-100'}`}>
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-[#737373]" />
            <input
              type="text"
              placeholder="Search for questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-[#1a1a1a] border border-[#333333] rounded-lg text-sm sm:text-base text-white placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-transparent transition-all duration-300"
            />
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 px-2">
          {/* Getting Started */}
          <div className={`transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up stagger-1 opacity-100' : 'opacity-100'}`}>
            <Card>
              <button
                onClick={() => {
                  const newSet = new Set(openCategories);
                  if (newSet.has('getting-started')) {
                    newSet.delete('getting-started');
                  } else {
                    newSet.add('getting-started');
                  }
                  setOpenCategories(newSet);
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-[#222222] transition-colors rounded-lg"
              >
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Zap className="h-6 w-6 text-[#f5c518]" />
                  Getting Started
                </h3>
                {openCategories.has('getting-started') ? (
                  <ChevronUp className="h-6 w-6 text-[#f5c518] flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-6 w-6 text-[#a1a1a1] flex-shrink-0" />
                )}
              </button>
              {openCategories.has('getting-started') && (
                <div className="px-4 pb-4 space-y-3 animate-slide-in-up">
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
              ).map((faq, index) => {
                const faqId = 'getting-started-' + index;
                return (
                  <Card 
                    key={index}
                    hover
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === faqId ? null : faqId)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-[#222222] transition-colors rounded-lg"
                    >
                      <span className="text-white font-semibold pr-4">{faq.q}</span>
                      {openFAQ === faqId ? (
                        <ChevronUp className="h-5 w-5 text-[#f5c518] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[#a1a1a1] flex-shrink-0" />
                      )}
                    </button>
                    {openFAQ === faqId && (
                      <div className="px-4 pb-4 animate-slide-in-up">
                        <p className="text-[#e5e5e5] leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
                </div>
              )}
            </Card>
          </div>

          {/* Property Management */}
          <div className={`transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up stagger-2 opacity-100' : 'opacity-100'}`}>
            <Card>
              <button
                onClick={() => {
                  const newSet = new Set(openCategories);
                  if (newSet.has('property-management')) {
                    newSet.delete('property-management');
                  } else {
                    newSet.add('property-management');
                  }
                  setOpenCategories(newSet);
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-[#222222] transition-colors rounded-lg"
              >
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-[#f5c518]" />
                  Property Management
                </h3>
                {openCategories.has('property-management') ? (
                  <ChevronUp className="h-6 w-6 text-[#0b3b5a] flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-6 w-6 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openCategories.has('property-management') && (
                <div className="px-4 pb-4 space-y-3 animate-slide-in-up">
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
                const faqId = 'property-management-' + index;
                return (
                  <Card 
                    key={index}
                    hover
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === faqId ? null : faqId)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-[#222222] transition-colors rounded-lg"
                    >
                      <span className="text-white font-semibold pr-4">{faq.q}</span>
                      {openFAQ === faqId ? (
                        <ChevronUp className="h-5 w-5 text-[#f5c518] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[#a1a1a1] flex-shrink-0" />
                      )}
                    </button>
                    {openFAQ === faqId && (
                      <div className="px-4 pb-4 animate-slide-in-up">
                        <p className="text-[#e5e5e5] leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
                </div>
              )}
            </Card>
          </div>

          {/* Billing & Payments */}
          <div className={`transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up stagger-3 opacity-100' : 'opacity-100'}`}>
            <Card>
              <button
                onClick={() => {
                  const newSet = new Set(openCategories);
                  if (newSet.has('billing-payments')) {
                    newSet.delete('billing-payments');
                  } else {
                    newSet.add('billing-payments');
                  }
                  setOpenCategories(newSet);
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-[#222222] transition-colors rounded-lg"
              >
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-[#f5c518]" />
                  Billing & Payments
                </h3>
                {openCategories.has('billing-payments') ? (
                  <ChevronUp className="h-6 w-6 text-[#f5c518] flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-6 w-6 text-[#a1a1a1] flex-shrink-0" />
                )}
              </button>
              {openCategories.has('billing-payments') && (
                <div className="px-4 pb-4 space-y-3 animate-slide-in-up">
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
                const faqId = 'billing-payments-' + index;
                return (
                  <Card 
                    key={index}
                    hover
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === faqId ? null : faqId)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-[#222222] transition-colors rounded-lg"
                    >
                      <span className="text-white font-semibold pr-4">{faq.q}</span>
                      {openFAQ === faqId ? (
                        <ChevronUp className="h-5 w-5 text-[#f5c518] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[#a1a1a1] flex-shrink-0" />
                      )}
                    </button>
                    {openFAQ === faqId && (
                      <div className="px-4 pb-4 animate-slide-in-up">
                        <p className="text-[#e5e5e5] leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
                </div>
              )}
            </Card>
          </div>

          {/* Tenant Management */}
          <div className={`transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up stagger-4 opacity-100' : 'opacity-100'}`}>
            <Card>
              <button
                onClick={() => {
                  const newSet = new Set(openCategories);
                  if (newSet.has('tenant-management')) {
                    newSet.delete('tenant-management');
                  } else {
                    newSet.add('tenant-management');
                  }
                  setOpenCategories(newSet);
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-[#222222] transition-colors rounded-lg"
              >
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="h-6 w-6 text-[#f5c518]" />
                  Tenant Management
                </h3>
                {openCategories.has('tenant-management') ? (
                  <ChevronUp className="h-6 w-6 text-[#f5c518] flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-6 w-6 text-[#a1a1a1] flex-shrink-0" />
                )}
              </button>
              {openCategories.has('tenant-management') && (
                <div className="px-4 pb-4 space-y-3 animate-slide-in-up">
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
                const faqId = 'tenant-management-' + index;
                return (
                  <Card 
                    key={index}
                    hover
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === faqId ? null : faqId)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-[#222222] transition-colors rounded-lg"
                    >
                      <span className="text-white font-semibold pr-4">{faq.q}</span>
                      {openFAQ === faqId ? (
                        <ChevronUp className="h-5 w-5 text-[#f5c518] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[#a1a1a1] flex-shrink-0" />
                      )}
                    </button>
                    {openFAQ === faqId && (
                      <div className="px-4 pb-4 animate-slide-in-up">
                        <p className="text-[#e5e5e5] leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
                </div>
              )}
            </Card>
          </div>

          {/* Maintenance */}
          <div className={`transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up stagger-5 opacity-100' : 'opacity-100'}`}>
            <Card>
              <button
                onClick={() => {
                  const newSet = new Set(openCategories);
                  if (newSet.has('maintenance')) {
                    newSet.delete('maintenance');
                  } else {
                    newSet.add('maintenance');
                  }
                  setOpenCategories(newSet);
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-[#222222] transition-colors rounded-lg"
              >
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Wrench className="h-6 w-6 text-[#f5c518]" />
                  Maintenance Requests
                </h3>
                {openCategories.has('maintenance') ? (
                  <ChevronUp className="h-6 w-6 text-[#f5c518] flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-6 w-6 text-[#a1a1a1] flex-shrink-0" />
                )}
              </button>
              {openCategories.has('maintenance') && (
                <div className="px-4 pb-4 space-y-3 animate-slide-in-up">
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
                const faqId = 'maintenance-' + index;
                return (
                  <Card 
                    key={index}
                    hover
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === faqId ? null : faqId)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-[#222222] transition-colors rounded-lg"
                    >
                      <span className="text-white font-semibold pr-4">{faq.q}</span>
                      {openFAQ === faqId ? (
                        <ChevronUp className="h-5 w-5 text-[#f5c518] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[#a1a1a1] flex-shrink-0" />
                      )}
                    </button>
                    {openFAQ === faqId && (
                      <div className="px-4 pb-4 animate-slide-in-up">
                        <p className="text-[#e5e5e5] leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
                </div>
              )}
            </Card>
          </div>

          {/* General */}
          <div className={`transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up stagger-6 opacity-100' : 'opacity-100'}`}>
            <Card>
              <button
                onClick={() => {
                  const newSet = new Set(openCategories);
                  if (newSet.has('general')) {
                    newSet.delete('general');
                  } else {
                    newSet.add('general');
                  }
                  setOpenCategories(newSet);
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-[#222222] transition-colors rounded-lg"
              >
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <HelpCircle className="h-6 w-6 text-[#f5c518]" />
                  General Questions
                </h3>
                {openCategories.has('general') ? (
                  <ChevronUp className="h-6 w-6 text-[#f5c518] flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-6 w-6 text-[#a1a1a1] flex-shrink-0" />
                )}
              </button>
              {openCategories.has('general') && (
                <div className="px-4 pb-4 space-y-3 animate-slide-in-up">
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
                const faqId = 'general-' + index;
                return (
                  <Card 
                    key={index}
                    hover
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === faqId ? null : faqId)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-[#222222] transition-colors rounded-lg"
                    >
                      <span className="text-white font-semibold pr-4">{faq.q}</span>
                      {openFAQ === faqId ? (
                        <ChevronUp className="h-5 w-5 text-[#f5c518] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[#a1a1a1] flex-shrink-0" />
                      )}
                    </button>
                    {openFAQ === faqId && (
                      <div className="px-4 pb-4 animate-slide-in-up">
                        <p className="text-[#e5e5e5] leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Still Need Help */}
        <div className={`max-w-2xl mx-auto mt-16 text-center transition-all duration-1000 ${visibleSections.has('help') ? 'animate-slide-in-up opacity-100' : 'opacity-100'}`}>
          <Card glow className="border-[#f5c518]/30">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Still Need Help?</h3>
              <p className="text-[#e5e5e5] mb-6">
                Can&apos;t find what you&apos;re looking for? Our support team is here to help you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => scrollToSection('contact')}
                  magnetic
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
                <Link href="/register">
                  <Button 
                    variant="outline"
                    magnetic
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
      <footer className="bg-[#0d0d0d] border-t border-[#222222]">
        <div className="w-full px-3 sm:px-6 lg:px-12 xl:px-16 py-8 sm:py-10 lg:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2">
              <div className="mb-6">
                <StayTrackLogo size={32} color="#f5c518" textColor="#ffffff" showText={true} />
              </div>
              <p className="text-[#e5e5e5] mb-6 max-w-md">
                StayTrack is a modern PG management system designed to streamline property operations, 
                tenant management, and financial tracking for accommodation providers.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-[#f5c518]/10 border border-[#f5c518]/20 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 hover:bg-[#f5c518]/20 transition-all duration-300">
                  <Globe className="h-5 w-5 text-[#f5c518]" />
                </div>
                <div className="w-10 h-10 bg-[#f5c518]/10 border border-[#f5c518]/20 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 hover:bg-[#f5c518]/20 transition-all duration-300">
                  <Zap className="h-5 w-5 text-[#f5c518]" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Features</h4>
              <ul className="space-y-2 text-[#a1a1a1] hover:*:text-[#f5c518] transition-colors">
                <li className="hover:translate-x-1 transition-transform cursor-pointer">Property Management</li>
                <li className="hover:translate-x-1 transition-transform cursor-pointer">Tenant Management</li>
                <li className="hover:translate-x-1 transition-transform cursor-pointer">Billing & Payments</li>
                <li className="hover:translate-x-1 transition-transform cursor-pointer">Maintenance Requests</li>
                <li className="hover:translate-x-1 transition-transform cursor-pointer">Analytics & Reports</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-[#a1a1a1] hover:*:text-[#f5c518] transition-colors">
                <li className="hover:translate-x-1 transition-transform cursor-pointer">Help Center</li>
                <li className="hover:translate-x-1 transition-transform cursor-pointer">Documentation</li>
                <li className="hover:translate-x-1 transition-transform cursor-pointer">Contact Us</li>
                <li className="hover:translate-x-1 transition-transform cursor-pointer">Privacy Policy</li>
                <li className="hover:translate-x-1 transition-transform cursor-pointer">Terms of Service</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#222222] mt-12 pt-8 text-center text-[#737373]">
            <p>&copy; 2024 StayTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
