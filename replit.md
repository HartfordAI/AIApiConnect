# Overview

This is a full-stack AI chat application built with React, Express, and TypeScript. The application allows users to interact with AI providers (OpenAI and DeepSeek) through a clean, modern chat interface. It features a terminal-inspired design with dark theme, real-time message handling, and persistent conversation sessions. The application uses an in-memory storage system for messages and supports API key management with session storage.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with custom design tokens and dark theme as default
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

The frontend follows a component-based architecture with clear separation between UI components (`/components/ui/`) and page components (`/pages/`). The application uses a monorepo structure with shared types and schemas between client and server.

## Backend Architecture

- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with JSON communication
- **Data Storage**: In-memory storage implementation with interface-based design for future database integration
- **Schema Validation**: Zod for runtime type checking and validation
- **Development**: Hot reload with tsx and Vite integration for seamless development experience

The backend uses a clean architecture pattern with separate layers for routes, storage, and business logic. The storage layer implements an interface pattern, making it easy to swap from in-memory storage to a persistent database solution.

## Data Storage Solutions

- **Current Implementation**: In-memory storage using Maps for users and messages
- **Database Ready**: Drizzle ORM configured for PostgreSQL with migration system
- **Session Management**: Session-based storage with unique session IDs for conversation persistence
- **Schema Design**: Separate tables for users and messages with proper relationships

The application is designed to easily transition from in-memory storage to PostgreSQL using the existing Drizzle configuration.

## Authentication and Authorization

- **API Key Management**: Client-side API key storage using sessionStorage
- **Provider Support**: Multi-provider architecture supporting OpenAI and DeepSeek
- **Session Isolation**: Each conversation maintains its own session ID for message isolation

The authentication model is based on API keys provided by users rather than traditional user authentication, allowing for immediate usage without account creation.

# External Dependencies

## AI Service Integrations

- **OpenAI API**: Integration with GPT-5 model for AI responses
- **DeepSeek API**: Alternative AI provider support (configured but implementation pending)
- **API Management**: User-provided API keys stored securely in browser session storage

## Database and ORM

- **Drizzle ORM**: Type-safe database queries and migrations
- **PostgreSQL**: Configured as the target database (currently using in-memory storage)
- **Neon Database**: Serverless PostgreSQL integration ready for deployment

## UI and Styling

- **Radix UI**: Headless component library for accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library following design system patterns

## Development and Build Tools

- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

## Additional Libraries

- **React Hook Form**: Form handling with validation
- **TanStack Query**: Server state management and caching
- **Wouter**: Lightweight routing for React
- **date-fns**: Date manipulation utilities
- **clsx**: Conditional className utility for dynamic styling