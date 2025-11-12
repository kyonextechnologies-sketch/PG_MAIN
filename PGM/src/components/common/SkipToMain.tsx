'use client';

import React from 'react';
import Link from 'next/link';

export function SkipToMain() {
  return (
    <Link
      href="#main-content"
      className="skip-to-main"
      onClick={(e) => {
        e.preventDefault();
        const main = document.getElementById('main-content');
        if (main) {
          main.focus();
          main.scrollIntoView({ behavior: 'smooth' });
        }
      }}
    >
      Skip to main content
    </Link>
  );
}

