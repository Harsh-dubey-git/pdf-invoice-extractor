# Flowbit - PDF Invoice Extractor

A comprehensive PDF Review Dashboard with AI-powered data extraction using Gemini API. Built as a monorepo with separate frontend and backend applications.

## 🏗️ Architecture

This project is structured as a monorepo with the following applications:

- **`apps/web`** - Next.js frontend application (React + TypeScript + shadcn/ui)
- **`apps/api`** - Node.js backend API (Express + TypeScript + MongoDB)
- **`packages/shared`** - Shared types and utilities

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd flowbit
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

**For the API (`apps/api/.env`):**
```env
MONGODB_URI=mongodb://localhost:27017/flowbit
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**For the Web App (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Running Locally

1. **Start both applications:**
```bash
npm run dev
```

This will start:
- Web app on http://localhost:3000
- API server on http://localhost:3001

2. **Or start individually:**
```bash
# Web app only
npm run dev:web

# API only  
npm run dev:api
```

## 📋 Features

### ✅ Implemented
- [x] Monorepo structure with npm workspaces
- [x] PDF upload and storage
- [x] AI data extraction using Gemini API
- [x] Invoice CRUD operations with MongoDB
- [x] Real-time search and pagination
- [x] Modern UI with shadcn/ui components
- [x] Error handling and loading states
- [x] TypeScript throughout

### 🔄 Core Workflow
1. **Upload PDF** - Users can upload PDF invoices (≤25MB)
2. **AI Extraction** - Gemini API extracts structured data
3. **Edit & Validate** - Users can edit extracted data
4. **Save to Database** - Invoice data is stored in MongoDB
5. **Search & Manage** - Full CRUD operations with search

## 🛠️ API Endpoints

### Upload
- `POST /api/upload` - Upload PDF file

### Extraction  
- `POST /api/extract` - Extract data using AI (Gemini/Groq)

### Invoices
- `GET /api/invoices` - List invoices (with search & pagination)
- `GET /api/invoices/:id` - Get single invoice
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

## 📊 Data Schema

```typescript
interface InvoiceDocument {
  _id?: string;
  fileId: string;
  fileName: string;
  vendor: {
    name: string;
    address?: string;
    taxId?: string;
  };
  invoice: {
    number: string;
    date: string;
    currency?: string;
    subtotal?: number;
    taxPercent?: number;
    total?: number;
    poNumber?: string;
    poDate?: string;
    lineItems: Array<{
      description: string;
      unitPrice: number;
      quantity: number;
      total: number;
    }>;
  };
  createdAt: string;
  updatedAt?: string;
}
```

## 🚀 Deployment

### Vercel Deployment

1. **Deploy Web App:**
```bash
cd apps/web
vercel --prod
```

2. **Deploy API:**
```bash
cd apps/api
vercel --prod
```

3. **Set Environment Variables:**
- In Vercel dashboard, add the same environment variables as local setup
- Update `NEXT_PUBLIC_API_URL` to point to your deployed API URL

### Environment Variables for Production

**API:**
- `MONGODB_URI` - MongoDB Atlas connection string
- `GEMINI_API_KEY` - Your Gemini API key
- `CORS_ORIGIN` - Your deployed web app URL

**Web:**
- `NEXT_PUBLIC_API_URL` - Your deployed API URL

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev          # Start both apps
npm run dev:web      # Start web app only
npm run dev:api      # Start API only

# Building
npm run build        # Build both apps
npm run build:web    # Build web app only
npm run build:api    # Build API only

# Linting
npm run lint         # Lint both apps

# Clean
npm run clean        # Clean both apps
```

### Project Structure

```
flowbit/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/         # App router pages
│   │   │   ├── components/  # React components
│   │   │   └── lib/         # Utilities & API client
│   │   └── package.json
│   └── api/                 # Express backend
│       ├── src/
│       │   ├── routes/      # API routes
│       │   ├── models/      # MongoDB models
│       │   ├── services/    # Business logic
│       │   └── utils/       # Utilities
│       └── package.json
├── packages/
│   └── shared/              # Shared types
│       ├── src/
│       └── package.json
└── package.json             # Root package.json
```

## 🔧 Configuration

### MongoDB Setup
1. Create a MongoDB Atlas cluster or use local MongoDB
2. Get your connection string
3. Add to `apps/api/.env` as `MONGODB_URI`

### Gemini API Setup
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `apps/api/.env` as `GEMINI_API_KEY`

## 📝 License

This project is part of an internship assignment.

## 🤝 Contributing

This is an internship project. For questions or issues, please contact the development team.