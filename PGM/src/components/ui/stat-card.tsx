'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  iconClassName,
  onClick,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {title}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {value}
              </p>
              {description && (
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
                  {description}
                </p>
              )}
              {trend && (
                <div className="flex items-center mt-2">
                  <span
                    className={cn(
                      'text-xs font-bold',
                      trend.isPositive
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                  </span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 ml-1">
                    {trend.label}
                  </span>
                </div>
              )}
            </div>
            <div
              className={cn(
                'p-3 rounded-lg bg-gradient-to-br shadow-md',
                iconClassName || 'bg-blue-500'
              )}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

