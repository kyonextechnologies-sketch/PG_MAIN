import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import { ThemeScript } from './theme-script';
import { SkipToMain } from '@/components/common/SkipToMain';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ['monospace'],
});

export const metadata: Metadata = {
  title: {
    default: "Smart PG Manager - Professional Property Management System",
    template: "%s | Smart PG Manager",
  },
  description: "A comprehensive, production-ready PG (Paying Guest) management system for property owners and tenants. Manage properties, tenants, billing, electricity bills, and maintenance requests with ease.",
  keywords: [
    "PG management",
    "property management",
    "electricity bills",
    "tenant management",
    "billing system",
    "maintenance requests",
    "property software",
    "SaaS property management",
  ],
  authors: [{ name: "Smart PG Manager Team" }],
  creator: "Smart PG Manager",
  publisher: "Smart PG Manager",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://pgmanager.com",
    siteName: "Smart PG Manager",
    title: "Smart PG Manager - Professional Property Management System",
    description: "Manage your PG properties efficiently with our comprehensive management platform",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Smart PG Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart PG Manager - Professional Property Management System",
    description: "Manage your PG properties efficiently with our comprehensive management platform",
    images: ["/og-image.png"],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://pgmanager.com"),
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SkipToMain />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
