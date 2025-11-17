'use client';

import * as React from "react"
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from "@/lib/utils"
import { scaleIn } from "@/lib/motion"

interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  glass?: boolean
  hover?: boolean
  glow?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = false, hover = true, glow = false, ...props }, ref) => {
    const baseStyles = glass
      ? "glass-morphism"
      : "bg-[#1a1a1a] border-[#333333]";

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-xl border shadow-lg transition-all duration-300",
          baseStyles,
          hover && "hover:shadow-xl hover:-translate-y-1",
          glow && "hover:shadow-[#f5c518]/20",
          className
        )}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={scaleIn}
        {...props}
      />
    );
  }
);
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold leading-tight tracking-tight text-white",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[#a1a1a1] leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
