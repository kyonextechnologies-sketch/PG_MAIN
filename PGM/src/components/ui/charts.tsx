'use client';

import React from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useTheme } from '@/lib/theme';

interface ChartProps {
  data: any[];
  title?: string;
  description?: string;
  className?: string;
}

// Line Chart Component
export function LineChartComponent({ data, title, description, className = '' }: ChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          {description && <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">{description}</p>}
        </div>
      )}
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#f0f0f0"} />
            <XAxis 
              dataKey="name" 
              stroke={isDark ? "#9ca3af" : "#666"}
              tick={{ fill: isDark ? "#d1d5db" : "#374151" }}
            />
            <YAxis 
              stroke={isDark ? "#9ca3af" : "#666"}
              tick={{ fill: isDark ? "#d1d5db" : "#374151" }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#1f2937' : 'white',
                border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: isDark ? '#f3f4f6' : '#111827'
              }}
              labelStyle={{ color: isDark ? '#f3f4f6' : '#111827' }}
            />
            <Legend 
              wrapperStyle={{ color: isDark ? '#d1d5db' : '#374151' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Area Chart Component
export function AreaChartComponent({ data, title, description, className = '' }: ChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          {description && <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">{description}</p>}
        </div>
      )}
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#f0f0f0"} />
            <XAxis 
              dataKey="name" 
              stroke={isDark ? "#9ca3af" : "#666"}
              tick={{ fill: isDark ? "#d1d5db" : "#374151" }}
            />
            <YAxis 
              stroke={isDark ? "#9ca3af" : "#666"}
              tick={{ fill: isDark ? "#d1d5db" : "#374151" }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#1f2937' : 'white',
                border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: isDark ? '#f3f4f6' : '#111827'
              }}
              labelStyle={{ color: isDark ? '#f3f4f6' : '#111827' }}
            />
            <Legend 
              wrapperStyle={{ color: isDark ? '#d1d5db' : '#374151' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#10b981" 
              fill="#10b981" 
              fillOpacity={0.3}
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Bar Chart Component
export function BarChartComponent({ data, title, description, className = '' }: ChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          {description && <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">{description}</p>}
        </div>
      )}
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#f0f0f0"} />
            <XAxis 
              dataKey="name" 
              stroke={isDark ? "#9ca3af" : "#666"}
              tick={{ fill: isDark ? "#d1d5db" : "#374151" }}
            />
            <YAxis 
              stroke={isDark ? "#9ca3af" : "#666"}
              tick={{ fill: isDark ? "#d1d5db" : "#374151" }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#1f2937' : 'white',
                border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: isDark ? '#f3f4f6' : '#111827'
              }}
              labelStyle={{ color: isDark ? '#f3f4f6' : '#111827' }}
            />
            <Legend 
              wrapperStyle={{ color: isDark ? '#d1d5db' : '#374151' }}
            />
            <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Pie Chart Component
export function PieChartComponent({ data, title, description, className = '' }: ChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          {description && <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">{description}</p>}
        </div>
      )}
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => {
                const labelColor = isDark ? '#d1d5db' : '#374151';
                return (
                  <text
                    x={props.x}
                    y={props.y}
                    fill={labelColor}
                    textAnchor={props.x > props.cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    fontSize={12}
                    fontWeight={500}
                  >
                    {`${props.name} ${(props.percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#1f2937' : 'white',
                border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: isDark ? '#f3f4f6' : '#111827'
              }}
              labelStyle={{ color: isDark ? '#f3f4f6' : '#111827' }}
            />
            <Legend 
              wrapperStyle={{ color: isDark ? '#d1d5db' : '#374151' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Multi-line Chart Component
export function MultiLineChartComponent({ data, title, description, className = '' }: ChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          {description && <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">{description}</p>}
        </div>
      )}
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#f0f0f0"} />
            <XAxis 
              dataKey="name" 
              stroke={isDark ? "#9ca3af" : "#666"}
              tick={{ fill: isDark ? "#d1d5db" : "#374151" }}
            />
            <YAxis 
              stroke={isDark ? "#9ca3af" : "#666"}
              tick={{ fill: isDark ? "#d1d5db" : "#374151" }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#1f2937' : 'white',
                border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: isDark ? '#f3f4f6' : '#111827'
              }}
              labelStyle={{ color: isDark ? '#f3f4f6' : '#111827' }}
            />
            <Legend 
              wrapperStyle={{ color: isDark ? '#d1d5db' : '#374151' }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name="Revenue"
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              name="Expenses"
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              name="Profit"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Stats Cards Component
export function StatsCards({ data }: { data: Array<{ title: string; value: string | number; change?: string; trend?: 'up' | 'down' }> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {data.map((stat, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              {stat.change && (
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    {stat.trend === 'up' ? '↗' : '↘'}
                  </span>
                </div>
              )}
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              index === 0 ? 'bg-blue-100 dark:bg-blue-900/50' :
              index === 1 ? 'bg-green-100 dark:bg-green-900/50' :
              index === 2 ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-purple-100 dark:bg-purple-900/50'
            }`}>
              <div className={`w-6 h-6 ${
                index === 0 ? 'text-blue-600 dark:text-blue-400' :
                index === 1 ? 'text-green-600 dark:text-green-400' :
                index === 2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-purple-600 dark:text-purple-400'
              }`}>
                📊
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

