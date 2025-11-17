'use client';

import * as React from "react"
import { motion, HTMLMotionProps } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from "@/lib/utils"

export interface InputProps extends Omit<HTMLMotionProps<'input'>, 'ref'> {
  error?: boolean
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error = false, icon, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const isPasswordInput = type === 'password';
    const resolvedType = isPasswordInput ? (showPassword ? 'text' : 'password') : type;

    const togglePasswordVisibility = () => setShowPassword(prev => !prev);
    
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]">
            {icon}
          </div>
        )}
        <motion.input
          type={resolvedType}
          className={cn(
            "flex h-11 w-full rounded-lg border bg-[#1a1a1a] px-4 py-2 text-sm text-white transition-all duration-300",
            "placeholder:text-[#737373]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-red-500 focus-visible:ring-red-500/50"
              : "border-[#333333] focus-visible:border-[#f5c518] focus-visible:ring-[#f5c518]/30",
            icon && "pl-10",
            isPasswordInput && "pr-10",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          suppressHydrationWarning={true}
          {...props}
        />
        {isPasswordInput && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {isFocused && !error && (
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              boxShadow: '0 0 0 2px rgba(245, 197, 24, 0.1)',
            }}
          />
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
