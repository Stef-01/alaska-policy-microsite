# Alaska Rural Health Policy Microsite

Custom Next.js microsite for an Alaska pilot of a rural diabetes eye-care policy framework. The app combines:

- A public-facing policy microsite with framework, explorer, methods, governance, and regional playbooks.
- A public `Investment Calculator` for Topcon-compatible retinal screening deployments.
- An open `/assumptions` workspace for tuning the assumption pack without code changes.

## Stack

- `Next.js 16` with App Router, TypeScript, Tailwind CSS, and Framer Motion
- `Prisma + SQLite` for assumption-set storage and assumptions tuning
- `Python ETL` to compile Alaska source data into a generated JSON data pack

## Data Sources In V1

- Alaska Department of Health public health region definitions
- U.S. Census ACS 2023 county population
- CDC PLACES 2025 county prevalence data
- Literature-backed diabetic retinopathy implementation and economic references

The generated simulator output includes a `predicted diabetes-rate reduction`, but that number is deliberately presented as an indicative, assumption-heavy synthetic bridge rather than an observed outcome.

## Local Setup

1. Copy the example environment file.

```bash
cp .env.example .env
```

2. Install dependencies.

```bash
npm install
```

3. Build the Alaska data pack, create the SQLite database, and seed the assumption sets.

```bash
npm run setup
```

4. Start the development server.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful Commands

```bash
npm run data:build
npm run db:push
npm run db:seed
npm run lint
npm run typecheck
npm run build
```

## Assumptions Workspace

- Workspace route: [http://localhost:3000/assumptions](http://localhost:3000/assumptions)
- The workspace is open by default in this prototype so teams can click in and tune assumptions directly.

The assumptions workspace supports:

- versioned assumption sets
- draft cloning
- resetting values to defaults
- publishing a draft as the active public pack
- previewing scenario changes against the currently published set

## Data Pack Notes

The generated file lives at [src/data/generated/alaska-data-pack.json](/Users/devasiathottunkal/Documents/New project/alaska-policy-microsite/src/data/generated/alaska-data-pack.json).

It combines:

- source-backed Alaska regional population and diabetes/access baselines
- literature-backed screening and clinical yield defaults
- synthetic readiness, provider/broadband context, and diabetes-rate bridge assumptions

## Production Notes

- Review the seeded synthetic bridge assumptions before using public outputs externally.
- The SQLite database is local-only for v1. Move Prisma to a managed database before multi-user deployment.
