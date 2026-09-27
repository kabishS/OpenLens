# 🔬 OpenLens — Public Knowledge & Intelligence Hub

> A high-value public interest platform powered by **Node.js**, **Express**, and **SerpAPI**. Designed to support education, scientific research, patent innovation, news literacy, civic employment, open learning, and accessibility.

---

## 🌟 Overview

**OpenLens** addresses high-value public needs by democratizing access to academic research, patent filings, verified news reporting, open educational materials, and public sector employment opportunities.

It bridges the gap between complex technical documentation and general public understanding by featuring an **AI Plain-Language Summarizer** and an **Accessibility-First Design** including native text-to-speech audio narration and WCAG AAA high-contrast modes.

---

## ⚙️ How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT / FRONTEND (SPA)                      │
│  • OpenLens UI (HTML5 / CSS Custom Properties)                  │
│  • Chart.js (Analytics)  • Web Speech API (Audio Narration)     │
│  • LocalStorage (Saved Workspace)                               │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP / JSON API Requests
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND ENGINE (Node.js / Express)             │
│  • Express Router & Input Sanitizer                             │
│  • In-Memory TTL Cache (10-min cache to reduce API overhead)    │
│  • Text Simplifier & Key Phrase Extractor                       │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Authenticated Search Requests
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                           SerpAPI                               │
│  • engine=google_scholar (Academic Literature)                  │
│  • engine=google_patents (Global Innovations & Claims)          │
│  • engine=google_news    (News Literacy & Media Radar)          │
│  • engine=google_jobs    (Civic & Non-Profit Careers)           │
│  • engine=google         (OER Courses & Civic Amenities)        │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Workflow:

1. **User Query Input**: The user selects a tool tab (e.g., *Academic Research*, *Patent Explorer*, *News Literacy*, or *Civic Jobs*) and enters a query or clicks a pre-set high-value topic chip.
2. **Backend API Processing**: The frontend dispatches a fetch request to the Express backend (`/api/scholar`, `/api/patents`, `/api/news`, etc.).
3. **Caching Check**: The Node.js server inspects its in-memory TTL cache. If a fresh result exists, it serves cached data instantly without consuming API requests.
4. **SerpAPI Search Dispatch**: On cache miss, the server executes an HTTP request to SerpAPI using the configured API key (`SERPAPI_KEY`) targeting the specialized search engine.
5. **Data Transformation & Normalization**: The backend standardizes raw SerpAPI responses into clean JSON objects (extracting PDF links, citations, assignees, inventors, dates, and snippets).
6. **Interactive Rendering & Analytics**: The client UI displays formatted result cards, updates Chart.js visual analytics (media diversity / citation counts), and prepares audio text-to-speech streams.
7. **Jargon Simplification**: Users can click **"Explain Plain English"** to send document snippets to `/api/summarize`, which extracts key takeaways and reading difficulty levels.

---

## 🛠️ Core Modules

| Module | Engine | Public Need Addressed | Key Features |
| :--- | :--- | :--- | :--- |
| **🎓 Academic Research** | `google_scholar` | Education & Scientific Literacy | Authors, citations, journal summaries, direct PDF links, BibTeX citations |
| **🔬 Patent Explorer** | `google_patents` | Technology & Innovation | Patent IDs, assignees, inventors, filing dates, abstract claims, PDF specs |
| **📰 News Literacy** | `google_news` | Media Literacy & Fact-Checking | Multi-source news streams, publishing source breakdown, media bias radar |
| **💼 Civic Jobs Portal** | `google_jobs` | Public Sector & STEM Careers | Non-profit, civic tech, green energy jobs, remote filters, direct apply links |
| **📚 Open Education (OER)**| `google` (filtered) | Free & Inclusive Learning | University courses (MIT OCW, Coursera), open textbooks (OpenStax), datasets |
| **🏛️ Civic Services** | `google` | Community Legal & Health | Public legal aid, libraries, community health clinics, veteran assistance |

---

## ♿ Accessibility Features (A11y)

- **👁️ High Contrast Mode**: One-click toggle (`Alt + C`) to activate a WCAG AAA compliant yellow-on-black color palette designed for visually impaired users.
- **🔊 Audio Text-to-Speech (TTS)**: Uses the browser's native Web Speech API to read aloud paper abstracts, news snippets, and simplified summaries (`Alt + R`).
- **🔠 Scalable Typography**: Controls (`A-`, `A`, `A+`) to scale font sizing up to 140% without breaking component layouts.
- **⌨️ Keyboard Navigation**: Keyboard shortcuts (`Alt + S` for search focus, `Alt + C` for contrast mode) and full tab stop focus rings (`:focus-visible`).

---

## 📡 API Reference

### `GET /api/scholar`
Query academic literature via Google Scholar.
- **Params**: `q` (string), `as_ylo` (year start), `as_yhi` (year end)

### `GET /api/patents`
Query global patents database.
- **Params**: `q` (string), `status` (`GRANT` \| `APPLICATION`)

### `GET /api/news`
Query verified news outlets.
- **Params**: `q` (string), `topic` (string)

### `GET /api/jobs`
Query civic tech and public interest jobs.
- **Params**: `q` (string), `location` (string)

### `GET /api/education`
Query open educational resources (OER) and university courses.
- **Params**: `q` (string), `type` (`all` \| `courses` \| `books` \| `datasets`)

### `POST /api/summarize`
Generate plain-language explanation of complex abstracts or patent claims.
- **Body**: `{ "title": "string", "text": "string" }`

### `GET /api/stats`
Check system health, active cache count, and SerpAPI status.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher

### 2. Installation
Clone or navigate to the project directory and ensure dependencies are installed:

```bash
npm install
```

### 3. Environment Configuration
Verify `.env` exists in the root directory:

```env
PORT=3000
SERPAPI_KEY=f902a9f8008c3431abec698bd2d488164b83d5ccb099aabc432569b448557a41
```

### 4. Running the Server

```bash
# Production Mode
npm start

# Development Mode (auto-reload on edit)
npm run dev
```

Open your browser and navigate to: **`http://localhost:3000`**

---

## 📥 Export & Workspace Utilities

Users can save items from any module to their persistent **Research Workspace** (`localStorage`). From the sidebar workspace drawer, items can be exported in multiple formats:

- **📥 Export JSON**: Structured JSON dataset for developer integrations (`openlens_workspace.json`).
- **📊 Export CSV**: Spreadsheet file compatible with Excel/Google Sheets (`openlens_workspace.csv`).
- **📑 Export BibTeX**: Formatted citations file (`citations.bib`) for academic reference managers (Zotero, Mendeley, LaTeX).

---

## 📜 License

Distributed under the **MIT License**. Free for educational, research, and public interest usage.
