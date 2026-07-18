# Photography Pixel Hub

منصة إدارة التصوير الاحترافية — SaaS for professional photographers.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL (Supabase) + Prisma ORM |
| Storage | Cloudflare R2 |
| Forms | React Hook Form + Zod |
| Icons | Lucide |
| Theming | next-themes (Dark / Light) |
| Toasts | sonner |
| RTL | Full Arabic RTL support |

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Generate Prisma client
npm run db:generate

# 4. Run development server
npm run dev
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create & apply migration |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
src/
├── app/              # Next.js App Router pages & layouts
├── actions/          # Server Actions
├── components/       # React components
│   ├── ui/           # shadcn/ui primitives
│   ├── layout/      # Layout components
│   ├── dashboard/    # Dashboard widgets
│   ├── shared/       # Shared/reusable components
│   └── ...
├── hooks/            # Custom React hooks
├── lib/              # Core libraries
│   ├── auth/         # Auth configuration
│   ├── prisma/       # Prisma client
│   ├── r2/           # Cloudflare R2 client
│   ├── supabase/     # Supabase clients
│   ├── utils/        # Utility functions
│   ├── validations/  # Zod schemas
│   └── constants/    # App constants & config
├── types/            # TypeScript types
├── providers/        # React context providers
└── styles/           # Global CSS (theme, RTL)
```

## License

ISC
