'use client';

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from "@/lib/utils"
import { buttonHover, calculateMagneticEffect, resetMagneticEffect } from "@/lib/motion"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-[#f5c518] text-[#0d0d0d] hover:bg-[#ffd000] shadow-md hover:shadow-lg hover:shadow-[#f5c518]/30 focus-visible:ring-[#f5c518]",
        destructive:
          "bg-[#ef4444] text-white hover:bg-[#dc2626] shadow-md hover:shadow-lg hover:shadow-red-500/30 focus-visible:ring-red-500",
        outline:
          "border-2 border-[#f5c518] bg-transparent text-[#f5c518] hover:bg-[#f5c518]/10 hover:shadow-[#f5c518]/20 shadow-md focus-visible:ring-[#f5c518]",
        secondary:
          "bg-[#2b2b2b] text-white hover:bg-[#333333] shadow-md hover:shadow-lg focus-visible:ring-[#333333]",
        ghost: "hover:bg-[#2b2b2b] hover:text-white text-[#a1a1a1]",
        link: "text-[#f5c518] underline-offset-4 hover:underline hover:text-[#ffd000]",
        success: "bg-[#10b981] text-white hover:bg-[#059669] shadow-md hover:shadow-lg hover:shadow-emerald-500/30 focus-visible:ring-emerald-500",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref"> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success"
  size?: "default" | "sm" | "lg" | "icon"
  magnetic?: boolean
  showRipple?: boolean
  children?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    magnetic = false,
    showRipple = true,
    children,
    onMouseMove,
    onMouseLeave,
    ...props 
  }, ref) => {
    const [magneticPosition, setMagneticPosition] = React.useState({ x: 0, y: 0 });
    const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number }>>([]);
    
    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (magnetic && !props.disabled) {
        const effect = calculateMagneticEffect(e, 0.25);
        setMagneticPosition(effect);
      }
      onMouseMove?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (magnetic) {
        setMagneticPosition({ x: 0, y: 0 });
      }
      onMouseLeave?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (showRipple && !props.disabled) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();
        
        setRipples(prev => [...prev, { x, y, id }]);
        
        setTimeout(() => {
          setRipples(prev => prev.filter(ripple => ripple.id !== id));
        }, 600);
      }
      
      (props as any).onClick?.(e);
    };

    if (asChild) {
      const slotProps = props as React.ComponentPropsWithoutRef<'button'>;
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} {...slotProps}>
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        variants={buttonHover}
        style={{
          x: magneticPosition.x,
          y: magneticPosition.y,
        }}
        {...props}
      >
        {/* Shimmer effect */}
        <span className="absolute inset-0 overflow-hidden rounded-lg">
          <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000" />
        </span>
        
        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none animate-[ping_0.6s_ease-out]"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 10,
              height: 10,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
        
        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
