'use client';

import React from 'react';

interface StayTrackLogoProps {
  /** Size of the logo in pixels */
  size?: number;
  /** Color of the logo (defaults to brand color #0b3b5a) */
  color?: string;
  /** Color of the text (defaults to brand color #0b3b5a) */
  textColor?: string;
  /** Whether to show the "StayTrack" text beside the logo */
  showText?: boolean;
  /** Custom class name for additional styling */
  className?: string;
}

export function StayTrackLogo({ 
  size = 44, 
  color = '#0b3b5a',
  textColor = '#0b3b5a',
  showText = true,
  className = ''
}: StayTrackLogoProps) {
  const iconSize = size;
  const textSize = size * 0.55; // Text is proportional to icon size

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* SVG Logo - Location Pin with Chart Arrow */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 120 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-label="StayTrack Logo"
      >
        {/* Location Pin (Teardrop Shape) - Exact match to reference */}
        <path
          d="M60 10C40.67 10 25 25.67 25 45C25 72 60 125 60 125C60 125 95 72 95 45C95 25.67 79.33 10 60 10Z"
          fill={color}
          className="transition-colors duration-300"
        />
        
        {/* Inner white circle background for chart */}
        <circle cx="60" cy="47" r="20" fill="white" opacity="0.95"/>
        
        {/* Upward Trending Chart Arrow Inside Pin - Matching reference */}
        <g transform="translate(45, 40)">
          {/* Chart line segments */}
          <path
            d="M5 18 L12 13 L19 10 L26 3"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Arrow head at the end */}
          <path
            d="M26 3 L23 3 L26 3 L26 6"
            fill={color}
          />
          <path
            d="M26 3 L21 5 M26 3 L24 8"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      {/* StayTrack Text */}
      {showText && (
        <span
          style={{ fontSize: `${textSize}px`, color: textColor }}
          className="font-semibold tracking-tight transition-colors duration-300"
        >
          StayTrack
        </span>
      )}
    </div>
  );
}

// Export a simple icon version without text for favicons
export function StayTrackIcon({ 
  size = 32, 
  color = '#0b3b5a' 
}: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="StayTrack Icon"
    >
      {/* Location Pin (Teardrop Shape) - Exact match to reference */}
      <path
        d="M60 10C40.67 10 25 25.67 25 45C25 72 60 125 60 125C60 125 95 72 95 45C95 25.67 79.33 10 60 10Z"
        fill={color}
      />
      
      {/* Inner white circle background for chart */}
      <circle cx="60" cy="47" r="20" fill="white" opacity="0.95"/>
      
      {/* Upward Trending Chart Arrow Inside Pin - Matching reference */}
      <g transform="translate(45, 40)">
        {/* Chart line segments */}
        <path
          d="M5 18 L12 13 L19 10 L26 3"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Arrow head at the end */}
        <path
          d="M26 3 L23 3 L26 3 L26 6"
          fill={color}
        />
        <path
          d="M26 3 L21 5 M26 3 L24 8"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

