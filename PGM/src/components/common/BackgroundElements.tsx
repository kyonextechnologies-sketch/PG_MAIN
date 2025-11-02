'use client';

import { Building, Home, Shield, Star, Crown, Users, CreditCard, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface BackgroundElementsProps {
  variant?: 'login' | 'register';
}

export function BackgroundElements({ variant = 'login' }: BackgroundElementsProps) {
  const icons = variant === 'login' 
    ? [Building, Home, Shield]
    : [Crown, Building, Star];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Floating Icons */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200/20 rounded-full blur-xl animate-float"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200/20 rounded-full blur-xl animate-float-delay"></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-indigo-200/20 rounded-full blur-xl animate-float-delay-2"></div>
      <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-pink-200/20 rounded-full blur-xl animate-float"></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Decorative Elements */}
      {icons.map((Icon, index) => {
        const positions = [
          { top: 'top-10', right: 'right-10', color: 'text-blue-300/30' },
          { top: 'bottom-10', right: 'left-10', color: 'text-purple-300/30' },
          { top: 'top-1/2', right: 'left-10', color: 'text-indigo-300/30' }
        ];
        
        const position = positions[index] || positions[0];
        
        return (
          <motion.div
            key={index}
            className={`absolute ${position.top} ${position.right} ${position.color}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: index * 0.2 }}
            suppressHydrationWarning
          >
            <Icon className={`w-${16 + index * 4} h-${16 + index * 4} animate-pulse`} />
          </motion.div>
        );
      })}

      {/* Additional floating elements */}
      <motion.div
        className="absolute top-1/3 right-1/4 w-2 h-2 bg-blue-400/40 rounded-full"
        animate={{ 
          y: [0, -20, 0],
          opacity: [0.4, 0.8, 0.4]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        suppressHydrationWarning
      />
      <motion.div
        className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-purple-400/40 rounded-full"
        animate={{ 
          y: [0, -15, 0],
          opacity: [0.3, 0.7, 0.3]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        suppressHydrationWarning
      />
      <motion.div
        className="absolute top-2/3 right-1/3 w-1 h-1 bg-indigo-400/50 rounded-full"
        animate={{ 
          y: [0, -25, 0],
          opacity: [0.5, 0.9, 0.5]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        suppressHydrationWarning
      />
    </div>
  );
}
