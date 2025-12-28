# Verit Admin Dashboard

A modern property management dashboard built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🏠 **Property Management** - Manage properties, units, and availability
- 👥 **Tenant Management** - Track tenant information and communication
- 📄 **Lease Management** - Handle lease agreements and renewals
- 💰 **Payment Tracking** - Monitor rent collection and financial analytics
- 🔧 **Maintenance** - Manage maintenance requests and work orders
- 📊 **Analytics & Reporting** - Business insights and performance metrics
- 🔐 **Secure Authentication** - JWT-based authentication with role management

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Authentication**: JWT tokens with secure storage

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API server running (see `/server` directory)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Update environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
admin-dashboard/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── providers.tsx      # React Query provider
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── layout/           # Layout components
├── lib/                  # Utilities and configuration
│   ├── api.ts           # API client functions
│   ├── auth.ts          # Authentication utilities
│   └── utils.ts         # General utilities
├── types/               # TypeScript type definitions
└── hooks/               # Custom React hooks
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically

## API Integration

The dashboard integrates with the backend API server running on port 4000. Make sure the server is running before starting the dashboard.

### Authentication Flow

1. User logs in via `/login` page
2. JWT token is stored in localStorage
3. API requests include Authorization header
4. Token is validated by backend on each request
5. Automatic logout on token expiration

## Features Implementation Status

- ✅ Project setup and configuration
- ✅ Authentication system
- ✅ Dashboard layout and navigation
- ✅ Basic dashboard overview
- 🚧 Property management (in progress)
- 🚧 Unit management (planned)
- 🚧 Tenant management (planned)
- 🚧 Lease management (planned)
- 🚧 Payment tracking (planned)
- 🚧 Maintenance requests (planned)
- 🚧 Reports and analytics (planned)

## Design System

The dashboard follows a consistent design system based on the provided mockup:

- **Primary Color**: #739BA4 (Dark Green)
- **Success**: #10B981 (Green)
- **Warning**: #F59E0B (Amber)
- **Error**: #EF4444 (Red)
- **Typography**: Inter font family
- **Components**: shadcn/ui with custom theming

## Development Guidelines

1. Use TypeScript for all components and utilities
2. Follow the established component structure
3. Use React Query for API state management
4. Implement proper error handling and loading states
5. Ensure responsive design for mobile/tablet
6. Follow ESLint rules and formatting standards

## Deployment

The application can be deployed to Vercel, Netlify, or any platform supporting Next.js applications.

For Vercel deployment:
```bash
npm run build
vercel --prod
```

Make sure to set the environment variables in your deployment platform.