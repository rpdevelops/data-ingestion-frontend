# Data Ingestion Frontend

Next.js 15 web application for the Data Ingestion Tool.

> **Main Documentation**: See [data-ingestion-tool](https://github.com/rpdevelops/data-ingestion-tool) for architecture overview and system flow.

**Live Application**: [https://app.rpdevelops.online](https://app.rpdevelops.online)

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- AWS Cognito User Pool configured

### Run Locally

```bash
pnpm install
pnpm dev
```

Access: [http://localhost:3000](http://localhost:3000)

### Docker

```bash
docker build -t data-ingestion-frontend .
docker run -p 3000:3000 --env-file .env data-ingestion-frontend
```

---

## Environment Variables

```bash
# AWS Cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_REGION=us-east-1
ALLOWED_GROUP=uploader

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| UI Components | ShadcnUI + Radix UI |
| Styling | TailwindCSS |
| Forms | React Hook Form + Zod |
| Icons | Tabler Icons |
| Notifications | Sonner |
| Auth | AWS Cognito |

---

## Project Structure

```
data-ingestion-frontend/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   ├── auth/                 # Login, callback pages
│   ├── client-area/          # Protected pages
│   │   ├── processing-jobs/  # Jobs overview and Upload CSV
│   │   ├── jobs/             # Job details
│   │   ├── issues/           # Issue resolution
│   │   ├── contacts/         # Contact list
│   └── page.tsx              # Landing page
├── components/
│   ├── ui/                   # ShadcnUI components
│   └── client-area/          # Feature components
├── actions/                  # Server Actions
├── lib/
│   ├── auth/                 # Cognito integration
│   └── api/                  # API client
└── types/                    # TypeScript definitions
```

---

## Available Scripts

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # ESLint
pnpm create-user  # Create Cognito user
```

---

## Key Features

### Authentication Flow

1. User clicks login
2. Redirect to Cognito hosted UI
3. Cognito redirects back with code
4. Exchange code for tokens
5. Store tokens in secure cookies
6. Middleware validates on protected routes

### CSV Upload

1. User selects CSV file
2. Client-side preview
3. Submit to backend API
4. Display job status and progress

### Issue Resolution

1. View issues list with filters
2. See conflicting rows side-by-side
3. Select winner / discard losers
4. Trigger reprocessing

### Real-time Updates

- Polling for job status changes
- Toast notifications for actions
- Progress indicators during processing

---

## Architectural Decision Records (ADRs)


### ADR-001: Server Actions Pattern

**Decision**: Use Server Actions for API calls.

**Rationale**:
- Type-safe server-side execution
- Automatic error handling
- Token injection without client exposure
- Progressive enhancement

---

### ADR-002: ShadcnUI Components

**Decision**: Use ShadcnUI over other component libraries.

**Rationale**:
- Full control over components (not npm dependency)
- Built on Radix UI (accessibility)
- TailwindCSS styling
- Easy customization

---

### ADR-003: Polling over WebSocket

**Decision**: Use polling for job status updates.

**Rationale**:
- Simpler implementation
- No persistent connections
- Adequate for use case
- WebSocket planned for future

---

### ADR-004: Cookie-based Token Storage

**Decision**: Store Cognito tokens in HTTP-only cookies.

**Rationale**:
- Protected from XSS
- Automatic inclusion in requests
- Secure flag for HTTPS
- Middleware validation

---

## Code Standards

- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- Functional components with hooks
- Server Actions for data operations

---

## Related Repositories

- [data-ingestion-tool](https://github.com/rpdevelops/data-ingestion-tool) - Main documentation
- [data-ingestion-backend](https://github.com/rpdevelops/data-ingestion-backend) - FastAPI API
- [data-ingestion-worker](https://github.com/rpdevelops/data-ingestion-worker) - Async processor
- [data-ingestion-infra](https://github.com/rpdevelops/data-ingestion-infra) - Terraform IaC
