# Data Ingestion Tool

> Data ingestion and processing platform with human-in-the-loop validation

## 📑 Table of Contents

- [Overview](#overview)
- [Architecture and Technologies](#architecture-and-technologies)
- [Project Structure](#project-structure)
- [Running Locally](#running-locally)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The Data Ingestion Tool is a data ingestion and processing platform developed with Next.js 15 and AWS Cognito. The system allows CSV file uploads, asynchronous processing, data validation, and issue resolution through a web interface.

---

## Architecture and Technologies

### **Frontend**
- **Framework**: Next.js 15 (App Router)
- **UI Components**: ShadcnUI + Radix UI
- **Styling**: TailwindCSS
- **Authentication**: AWS Cognito
- **Forms**: React Hook Form + Zod validation
- **Icons**: Tabler Icons
- **Notifications**: Sonner (toast notifications)

### **Backend**
- **Runtime**: FastAPI (Python)
- **Database**: PostgreSQL (RDS)
- **Authentication**: AWS Cognito JWT
- **Storage**: Amazon S3
- **Queue**: Amazon SQS
- **Infrastructure**: ECS Fargate

### **Architecture Pattern**
The project follows the **SSR + Actions + API** pattern:

```
┌─────────────┐
│   Page.tsx  │ ← Server-Side Rendering (SSR)
│   (SSR)     │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Actions    │ ← Server Actions (Business Logic)
│  *.ts       │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Backend    │ ← FastAPI (Python)
│  API        │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Database   │ ← PostgreSQL (RDS)
│  PostgreSQL │
└─────────────┘
```

**Benefits**:
- ✅ Clear separation of concerns
- ✅ Code reusability
- ✅ Easy testing
- ✅ Maintainability
- ✅ Performance (SSR)

---

## Project Structure

```
data-ingestion-frontend/
├── app/                    # App Router (Next.js 15)
│   ├── api/               # API Routes
│   ├── client-area/       # Client area (authenticated)
│   ├── auth/              # Authentication pages
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/                # UI components (ShadcnUI)
│   └── client-area/       # Client area components
├── actions/               # Server Actions
├── lib/                   # Utilities and configurations
│   ├── auth/              # Cognito authentication
│   └── supabase/          # Legacy Supabase (to be removed)
├── scripts/               # Utility scripts
└── docs/                  # Documentation
```

---

## Running Locally

### **Prerequisites**
- Node.js 18+ 
- pnpm
- AWS Cognito User Pool configured

### **Setup**

1. **Clone the repository**:
   ```bash
   git clone [repository-url]
   cd data-ingestion-frontend
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Configure in `.env.local`:
   ```env
   # AWS Cognito (required)
   COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
   COGNITO_REGION=us-east-1
   
   # Authorization (optional - defaults to "uploader")
   ALLOWED_GROUP=uploader
   
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Install dependencies**:
   ```bash
   pnpm install
   ```

4. **Create a Cognito user**:
   ```bash
   pnpm create-user email@example.com "Password123!"
   ```

5. **Run the project**:
   ```bash
   pnpm dev
   ```

6. **Access**: [localhost:3000](http://localhost:3000)

### **Available Scripts**
```bash
pnpm dev          # Development
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # Code linting
pnpm create-user  # Create Cognito user
```

---

## Contributing

### **Code Standards**
- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- Functional components with hooks
- Server Actions for data operations

### **Commit Structure**
```
feat: new feature
fix: bug fix
docs: documentation
style: code formatting
refactor: refactoring
test: tests
chore: maintenance tasks
```

---

## License

This project is a proprietary portfolio.

---

**Developed by Robson Paradella Rocha**
