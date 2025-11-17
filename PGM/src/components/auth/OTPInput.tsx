'use client';

import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  onResend?: () => void;
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  errorMessage?: string;
  resendCooldown?: number; // in seconds
}

export function OTPInput({
  length = 6,
  onComplete,
  onResend,
  isLoading = false,
  isSuccess = false,
  isError = false,
  errorMessage,
  resendCooldown = 60,
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [countdown, setCountdown] = useState(resendCooldown);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    
    // Handle paste of multiple digits
    if (value.length > 1) {
      const pastedData = value.slice(0, length - index).split('');
      pastedData.forEach((digit, i) => {
        if (index + i < length) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus on next empty input or last input
      const nextIndex = Math.min(index + pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      setActiveIndex(nextIndex);
      
      // Check if OTP is complete
      if (newOtp.every(digit => digit !== '')) {
        onComplete(newOtp.join(''));
      }
      return;
    }

    // Handle single digit
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }

    // Call onComplete if all digits entered
    if (newOtp.every(digit => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      
      if (otp[index]) {
        // Clear current input
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // Move to previous input and clear it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
        setActiveIndex(index - 1);
      }
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }
    
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
    
    const newOtp = [...otp];
    pastedData.split('').forEach((digit, i) => {
      if (i < length) {
        newOtp[i] = digit;
      }
    });
    
    setOtp(newOtp);
    
    // Focus last filled input
    const lastFilledIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[lastFilledIndex]?.focus();
    setActiveIndex(lastFilledIndex);
    
    // Check if OTP is complete
    if (newOtp.every(digit => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleResend = () => {
    if (canResend && onResend) {
      setOtp(Array(length).fill(''));
      setActiveIndex(0);
      setCountdown(resendCooldown);
      setCanResend(false);
      inputRefs.current[0]?.focus();
      onResend();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-6">
      {/* OTP Input Boxes */}
      <div className="flex justify-center gap-2 sm:gap-3">
        {otp.map((digit, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => setActiveIndex(index)}
              disabled={isLoading || isSuccess}
              className={`
                w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl
                border-2 transition-all duration-200
                bg-[#1a1a1a] text-white
                focus:outline-none focus:ring-2
                ${
                  isError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                    : isSuccess
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500/50'
                    : activeIndex === index
                    ? 'border-[#f5c518] ring-2 ring-[#f5c518]/50'
                    : digit
                    ? 'border-[#f5c518]/50'
                    : 'border-[#333333]'
                }
                ${isLoading || isSuccess ? 'opacity-50 cursor-not-allowed' : ''}
                hover:border-[#f5c518]/70
              `}
            />
          </motion.div>
        ))}
      </div>

      {/* Status Messages */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2 text-sm text-gray-400"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying OTP...</span>
          </motion.div>
        )}

        {isSuccess && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center justify-center gap-2 text-sm text-green-500"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Phone number verified successfully!</span>
          </motion.div>
        )}

        {isError && errorMessage && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2 text-sm text-red-500"
          >
            <XCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {!isLoading && !isSuccess && !isError && (
          <motion.div
            key="timer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center text-sm text-gray-400"
          >
            {countdown > 0 ? (
              <span>OTP expires in {formatTime(countdown)}</span>
            ) : (
              <span className="text-yellow-500">OTP expired. Please request a new one.</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resend Button */}
      {onResend && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleResend}
            disabled={!canResend || isLoading || isSuccess}
            className={`
              text-sm font-medium transition-all duration-200
              ${
                canResend && !isLoading && !isSuccess
                  ? 'text-[#f5c518] hover:text-[#ffd000] hover:bg-[#f5c518]/10'
                  : 'text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${!canResend ? 'opacity-50' : ''}`} />
            {canResend ? 'Resend OTP' : `Resend in ${countdown}s`}
          </Button>
        </div>
      )}

      {/* Helper Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-xs text-gray-500"
      >
        Didn&apos;t receive the code? Check your phone or click resend above
      </motion.p>
    </div>
  );
}

