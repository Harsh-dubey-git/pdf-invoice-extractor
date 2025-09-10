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
GROQ_API_KEY=your_grok_api_key
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

```

## 🚀 Deployment

### Deployed on render 
https://pdfinvoiceextractor.onrender.com/?mode=edit 

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


