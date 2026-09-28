# MutualFund LTCG Analyzer

A SvelteKit app to upload mutual fund transaction exports (Groww-style), group by scheme, and compute LTCG-qualified units using FIFO tax-lot accounting.

Quick start

```bash
pnpm install
pnpm dev
```

Deploying to Vercel

1. In the GitHub repository, add these repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

2. The included GitHub Actions workflow will run on pushes to `main`/`master` and deploy the production build to Vercel.

3. You can also deploy locally using the Vercel CLI:

```bash
npm i -g vercel
vercel --prod
```

