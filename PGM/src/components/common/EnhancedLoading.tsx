'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface EnhancedLoadingProps {
  text?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function EnhancedLoading({ 
  text = 'Loading...', 
  fullScreen = false,
  size = 'md' 
}: EnhancedLoadingProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-[#0d0d0d]/80 backdrop-blur-sm'
    : 'flex items-center justify-center py-8';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-4">
        {/* Spinning loader with yellow accent */}
        <motion.div
          className={`${sizeClasses[size]} rounded-full border-4 border-[#333333] border-t-[#f5c518]`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Loading text with pulse animation */}
        {text && (
          <motion.p
            className="text-white font-medium"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            {text}
          </motion.p>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton Loader with shimmer effect
 */
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  circle?: boolean;
}

export function Skeleton({ width, height, className = '', circle = false }: SkeletonProps) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`animate-shimmer bg-[#1a1a1a] ${circle ? 'rounded-full' : 'rounded-lg'} ${className}`}
      style={style}
    />
  );
}

/**
 * Card Skeleton for loading states
 */
export function CardSkeleton() {
  return (
    <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-6 space-y-4">
      <Skeleton height={24} width="60%" />
      <Skeleton height={16} width="40%" />
      <div className="space-y-2">
        <Skeleton height={12} width="100%" />
        <Skeleton height={12} width="90%" />
        <Skeleton height={12} width="95%" />
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-[#333333]">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton height={16} />
        </td>
      ))}
    </tr>
  );
}

