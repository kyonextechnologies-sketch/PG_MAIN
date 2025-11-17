import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import { ThemeScript } from './theme-script';

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
    default: "StayTrack - Modern PG Management System",
    template: "%s | StayTrack",
  },
  description: "StayTrack - A modern PG (Paying Guest) management system for efficiently managing tenants, rent, and utilities. Streamline your property management with our professional platform.",
  keywords: [
    "StayTrack",
    "PG management",
    "property management",
    "electricity bills",
    "tenant management",
    "billing system",
    "maintenance requests",
    "property software",
    "SaaS property management",
  ],
  authors: [{ name: "StayTrack Team" }],
  creator: "StayTrack",
  publisher: "StayTrack",
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
    url: process.env.NEXT_PUBLIC_APP_URL || "https://staytrack.com",
    siteName: "StayTrack",
    title: "StayTrack - Modern PG Management System",
    description: "StayTrack helps you manage your PG properties efficiently with our modern management platform",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StayTrack",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StayTrack - Modern PG Management System",
    description: "StayTrack helps you manage your PG properties efficiently with our modern management platform",
    images: ["/og-image.png"],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://staytrack.com"),
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0d0d0d",
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0b3b5a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="StayTrack" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
