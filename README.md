# SentinelAI — AI Sentiment Analysis Platform for Brand Monitoring

> **Documentation:** See `Document.docx` for the full documentation report.
---

## Overview

SentinelAI is a prototype web application that helps teams monitor brand reputation across social media, news, blogs, forums, and review-style conversations through a unified analytics dashboard. The system goes beyond simple sentiment labelling — it surfaces sentiment trends, flags unusual risk signals, and routes high-priority mentions into a triage workflow for team action.

Built as part of an AI Intern Case Study: AI Sentiment Analysis Platform for Brand Monitoring and Reputation Risk Detection.

---

## Features

- **Cross-channel monitoring** — Twitter, Reddit, Forum, News, Blog, Review in one unified feed
- **AI sentiment classification** — RoBERTa model classifies each mention as positive, negative, neutral, or unclassified
- **Topic clustering** — Zero-shot BART-MNLI assigns complaint/praise themes (pricing, service, quality, delivery, support, design, performance, safety)
- **KPI dashboard** — Total mentions, sentiment split, mention velocity, negative share, anomaly score
- **Trend charts** — Daily and weekly sentiment trend visualisations
- **Alerts center** — Crisis signals, negative spikes, and volume spikes with severity levels
- **Mention triage** — Priority labels, status tracking, assignee, SLA indicator, follow-up notes
- **Saved filters** — Persistent filter sets stored in localStorage
- **Export** — CSV and PDF export from mentions feed and dashboard
- **N8N pipeline** — Importable workflow for production data ingestion and orchestration

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Charts | Recharts |
| Sentiment Model | cardiffnlp/twitter-roberta-base-sentiment-latest (HuggingFace) |
| Topic Model | facebook/bart-large-mnli (HuggingFace, zero-shot) |
| Pipeline | Python 3.11, HuggingFace Transformers, PyTorch |
| Orchestration | N8N (importable workflow) |

---

## Project Structure

```
sentiment-platform/
├── src/
│   ├── app/                  # Next.js pages
│   │   ├── page.tsx          # Dashboard
│   │   ├── mentions/         # Mention feed + detail view
│   │   ├── alerts/           # Alerts center
│   │   ├── topics/           # Topic clustering
│   │   └── setup/            # Brand/keyword tracking setup
│   ├── components/           # Shared UI components
│   ├── lib/                  # Analytics, alerts, export utilities
│   └── data/                 # TypeScript data layer
├── classifier/
│   ├── build_brands_dataset.py   # Build brand-specific tweet dataset
│   ├── generate_data.py          # Generate raw mentions CSV
│   ├── classify.py               # HuggingFace classification pipeline
│   └── requirements.txt
├── data/
│   ├── dataset/brands.csv        # Source dataset (135 brand tweets)
│   ├── mentions_raw.csv          # Raw mentions (no labels)
│   └── mentions_classified.json  # Classified output (feeds dashboard)
└── n8n/
    └── sentiment_pipeline.json   # Importable N8N workflow
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- npm

### 1. Install frontend dependencies
```bash
npm install
```

### 2. Run the dashboard
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

The app runs immediately — `data/mentions_classified.json` is already included.

---

## Re-running the Classification Pipeline

Only needed if you want to regenerate the data from scratch.

### Install Python dependencies
```bash
cd classifier
pip install -r requirements.txt
```

### Step 1 — Rebuild the brand dataset (optional)
Only needed if you want to change the source tweets.
```bash
python build_brands_dataset.py
```

### Step 2 — Generate raw mentions CSV
```bash
python generate_data.py
```

### Step 3 — Classify with HuggingFace models
Downloads models on first run (~2GB total, cached after that).
```bash
python classify.py
```

Output is written to `data/mentions_classified.json` and the dashboard reads it automatically on next load.

---

## AI Models

| Model | Purpose | Source |
|---|---|---|
| cardiffnlp/twitter-roberta-base-sentiment-latest | Sentiment classification (positive/negative/neutral/unclassified) | [HuggingFace](https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment-latest) |
| facebook/bart-large-mnli | Zero-shot topic classification | [HuggingFace](https://huggingface.co/facebook/bart-large-mnli) |

Mentions with sentiment confidence below 0.55 are labelled `unclassified` rather than forced into an incorrect category.

---

## N8N Pipeline

The file `n8n/sentiment_pipeline.json` is an importable N8N workflow that defines the full production ingestion pipeline:

```
Schedule Trigger (every 6h)
  → Twitter / Reddit / Forum / News / Blog Sources
  → Merge → Deduplicate → Language Filter
  → HuggingFace Classifier
  → Alert Detection + Write to Data Store
```

To use: open your N8N instance → Import workflow → select `sentiment_pipeline.json`. Replace the simulated source nodes with live API credentials for production deployment.

---

## Data

The prototype uses a curated synthetic dataset of 135 brand-specific tweets (45 per brand: Nike, Tesla, Apple), scaled to 294 classified mentions across a simulated 30-day window with an intentional negative spike at days 8–10. In production, `generate_data.py` is replaced by live API ingestion via the N8N pipeline.

---

## License

Prototype — built for intern case study demonstration purposes.
