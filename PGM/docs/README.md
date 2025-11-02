# Smart PG Manager - Industry-Level Documentation

## Overview

Smart PG Manager is a comprehensive property management system built with Next.js 16, TypeScript, and modern web technologies. This system provides industry-level features for managing PG (Paying Guest) accommodations with advanced electricity bill management, tenant management, and owner dashboards.

## Architecture

### Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand
- **Authentication**: NextAuth.js
- **Testing**: Jest, React Testing Library
- **Performance**: Performance API, Web Vitals
- **Security**: XSS Protection, CSRF Protection, Input Sanitization

### Project Structure

```
PGM/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── api/               # API routes
│   │   ├── owner/             # Owner-specific pages
│   │   └── tenant/            # Tenant-specific pages
│   ├── components/            # Reusable UI components
│   │   ├── common/            # Common components
│   │   ├── forms/             # Form components
│   │   ├── layout/            # Layout components
│   │   └── ui/                # Base UI components
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts            # Authentication configuration
│   │   ├── errors.ts          # Error handling system
│   │   ├── logger.ts          # Logging system
│   │   ├── security.ts        # Security utilities
│   │   ├── validation.ts      # Input validation
│   │   └── performance.ts     # Performance monitoring
│   ├── services/              # Business logic services
│   ├── store/                 # State management
│   ├── types/                 # TypeScript type definitions
│   └── __tests__/             # Test files
├── docs/                      # Documentation
└── public/                    # Static assets
```

## Features

### Core Features

1. **User Management**
   - Role-based access control (Owner/Tenant)
   - Secure authentication with NextAuth.js
   - Session persistence and management

2. **Property Management**
   - Property registration and management
   - Room and bed allocation
   - Amenities tracking

3. **Tenant Management**
   - Tenant registration and profiles
   - Room assignment and tracking
   - Communication system

4. **Electricity Bill Management**
   - Image-based meter reading extraction
   - Automatic bill calculation
   - Bill approval workflow
   - Integration with rent system

5. **Payment System**
   - UPI payment integration
   - Payment tracking and history
   - Invoice generation

6. **Maintenance System**
   - Request submission and tracking
   - Priority-based assignment
   - Status updates and notifications

### Advanced Features

1. **Security**
   - XSS protection
   - CSRF protection
   - Input sanitization
   - Rate limiting
   - Security headers

2. **Performance**
   - Performance monitoring
   - Web Vitals tracking
   - Performance budgets
   - Optimization recommendations

3. **Error Handling**
   - Comprehensive error system
   - User-friendly error messages
   - Error logging and monitoring
   - Graceful degradation

4. **Testing**
   - Unit tests
   - Integration tests
   - Component testing
   - E2E testing setup

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd PGM
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure environment variables:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

5. Start the development server:
```bash
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth secret key | Required |
| `NODE_ENV` | Environment | `development` |

## Development

### Code Standards

1. **TypeScript**: Strict mode enabled
2. **ESLint**: Configured with Next.js rules
3. **Prettier**: Code formatting
4. **Husky**: Pre-commit hooks
5. **Conventional Commits**: Commit message format

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check

# Build for production
npm run build
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signout` - User sign out
- `GET /api/auth/session` - Get current session

### Electricity Management

- `GET /api/electricity/settings` - Get electricity settings
- `PUT /api/electricity/settings` - Update electricity settings
- `POST /api/electricity/bills` - Submit electricity bill
- `PUT /api/electricity/bills/:id/approve` - Approve bill
- `PUT /api/electricity/bills/:id/reject` - Reject bill

### Property Management

- `GET /api/properties` - Get properties
- `POST /api/properties` - Create property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

## Security

### Security Features

1. **Input Validation**: All inputs are validated and sanitized
2. **XSS Protection**: Content Security Policy headers
3. **CSRF Protection**: Token-based CSRF protection
4. **Rate Limiting**: API rate limiting
5. **File Upload Security**: File type and size validation
6. **Authentication**: Secure session management

### Security Headers

```typescript
const securityHeaders = {
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
```

## Performance

### Performance Monitoring

- Web Vitals tracking
- Performance budgets
- Resource timing
- User interaction metrics

### Optimization Strategies

1. **Code Splitting**: Dynamic imports
2. **Image Optimization**: Next.js Image component
3. **Bundle Analysis**: Webpack bundle analyzer
4. **Caching**: Strategic caching strategies
5. **Lazy Loading**: Component lazy loading

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Configuration

1. Set production environment variables
2. Configure database connections
3. Set up monitoring and logging
4. Configure CDN and caching

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Monitoring and Logging

### Logging Levels

- **DEBUG**: Detailed debugging information
- **INFO**: General information
- **WARN**: Warning messages
- **ERROR**: Error conditions
- **FATAL**: Critical errors

### Performance Metrics

- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run quality checks
5. Submit a pull request

### Code Review Process

1. Automated testing
2. Code quality checks
3. Security scanning
4. Performance testing
5. Manual review

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation wiki

## Changelog

### Version 1.0.0
- Initial release
- Core PG management features
- Electricity bill management
- User authentication
- Payment integration
- Security implementation
- Performance monitoring
- Comprehensive testing

