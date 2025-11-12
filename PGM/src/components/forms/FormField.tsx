'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  className?: string;
  options?: { value: string; label: string }[];
  disabled?: boolean;
  description?: string;
}

export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  className,
  options = [],
  disabled = false,
  description,
}: FormFieldProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];
  const errorMessage = error?.message as string | undefined;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  'resize-none',
                  error && 'border-red-500 focus:border-red-500',
                  className
                )}
              />
            )}
          />
        );

      case 'select':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                <SelectTrigger
                  className={cn(
                    error && 'border-red-500 focus:border-red-500',
                    className
                  )}
                >
                  <SelectValue placeholder={placeholder || `Select ${label || name}`} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        );

      default:
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  error && 'border-red-500 focus:border-red-500',
                  className
                )}
              />
            )}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={name} className={cn(required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
          {label}
        </Label>
      )}
      {renderInput()}
      {description && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errorMessage}</p>
      )}
    </div>
  );
}

