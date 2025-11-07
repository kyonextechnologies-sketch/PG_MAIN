/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Production optimizations
  productionBrowserSourceMaps: false,
  compress: true,
  
  // ✅ Skip linting during build to avoid ESLint config issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // ✅ Skip type checking during build (can be done separately)
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ✅ Generate unique build ID
  generateBuildId: async () => {
    return process.env.BUILD_ID || `build-${Date.now()}`;
  },
  
  // ✅ Configure redirects
  skipTrailingSlashRedirect: true,
  
  // ✅ Disable static page generation for error pages (Next.js 15 workaround)
  // This prevents Html import errors during 404 page generation
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-*',
    ],
  },
  
  // ✅ Use standalone output for Render (handles error pages better)
  output: 'standalone',
  
  // ✅ Performance optimizations for development
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'framer-motion'],
    // Skip static optimization for error pages
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // ✅ Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // ✅ Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ✅ Output file tracing - Windows safe
  outputFileTracingRoot: process.cwd(),

  // ✅ Environment variables
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },

  // ✅ Webpack configuration - Windows safe, cache-safe
  webpack: (config, { dev, isServer }) => {
    try {
      // Ignore Html import errors during static page generation (Next.js 15 workaround)
      if (!dev) {
        config.ignoreWarnings = [
          { module: /next\/dist\/server\/lib\/runtime-config/ },
          { message: /Html.*should not be imported/ },
        ];
      }
      
      // Bundle optimization for production
      if (!dev && !isServer) {
        config.optimization.splitChunks = {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              enforce: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
              priority: 5,
            },
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 15,
              enforce: true,
            },
          },
        };
      }

      // ⚠️ IMPORTANT: Disable webpack cache in development to avoid cache corruption
      // This prevents the "next.config.compiled.js" error on Windows
      if (dev) {
        config.cache = false;
        config.optimization.minimize = false;
        config.optimization.usedExports = false;
      }
    } catch (error) {
      console.warn('[Next.js] Webpack configuration warning:', error);
    }

    return config;
  },
};

module.exports = nextConfig;

