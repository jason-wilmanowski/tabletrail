# TableTrail

A tool for analyzing and visualizing complex relational databases — built to help developers understand database structures rather than administer them.

---

## Overview

Working with a large, grown database is hard. Documentation is often outdated, and even when it isn't, understanding how dozens or hundreds of tables relate to each other rarely fits on one screen.

TableTrail is not another database admin tool like pgAdmin, DBeaver, or phpMyAdmin. Instead of managing data, it focuses on **understanding structure**: scanning a database, mapping out its tables, columns, and relationships, and presenting that structure as something a developer can actually explore.

It's aimed at developers who need to:

- get productive in an unfamiliar or legacy database faster
- explore tables and foreign-key relationships visually
- onboard new team members onto existing systems
- keep a persistent, browsable record of a database's structure without re-scanning it every time

---

## Current Features

### Backend

- **Database scanning** for PostgreSQL, MySQL, and MariaDB — reads tables, columns, data types, primary keys, foreign keys, and constraints directly from the source database, in three queries per scan regardless of the number of tables
- **Persistent schema cache** — scanned structures are stored in their own database (not re-scanned on every request), organized as a layered schema: databases → tables → columns → constraints
- **Full CRUD** for managed database connections (create via scan, read, update connection details, delete)
- **Rescan** support to refresh an already-scanned database's structure — custom relations are kept, only those whose columns no longer exist are removed
- **Export system** for scanned schemas, currently supporting **JSON**, **Markdown**, and **PDF** (PDF generated via Jinja2 templates rendered through WeasyPrint); connection details (host, port, database name, username) are only included on request, the password never
- **Custom column relations** — user-defined, column-to-column relations that are not real foreign keys, stored per database with a free color and an optional description, exposed through full CRUD endpoints; they reference columns by schema, table and column name, so they survive a rescan
- **Encrypted credentials** — stored connection passwords are AES-GCM encrypted and never returned by the API
- Structured service/repository layering with typed exceptions that each endpoint maps to an HTTP error

### Frontend

A developer-tool-styled web interface with dark and light themes, built as a single-page application:

- **Interactive schema graph** — every table renders as a node showing its columns, data types, and primary/foreign key indicators, with foreign-key relationships drawn as edges between tables; auto-laid-out via Dagre, pan/zoom/minimap included
- **Table inspector panel** — click any table to see its full column and constraint details
- **Sidebar with live search and schema grouping** — a virtualized list grouped by schema, built to stay responsive even on databases with hundreds of tables; a toggle switches the search between **tables** and **columns** (filtered client-side, with match counts)
- **Jump to a column** — clicking a column search result zooms the graph to its table and briefly highlights the column
- **Connection management** — add a new database connection through a guided form (with per-type validation and branded database-type icons), view all connected databases, and edit or delete a connection
- **Database detail workspace** — combines the schema graph, table sidebar, and connection details (type, host, port, database name, last scan) in one view, including rescan and delete actions; the rescan dialog warns when custom relations could be removed, and an optional setting flags outdated scans
- **Persistent graph layout** — tables moved manually in the graph keep their position; layouts are saved per database in the browser (localStorage) and restored on the next visit, while tables without a saved position fall back to the automatic Dagre layout
- **Custom column relations** — in an edit mode, draw a relation between two columns, pick a color and add an optional note; custom relations are persisted via the backend and rendered visually distinct from real foreign-key edges
- **Export from the UI** — download a scanned schema as JSON, Markdown, or PDF, with a configurable default format and an opt-in for connection details
- **Settings** — stored per browser, only values you change are saved:
  - **General** — relation delete confirmation, hover previews, export defaults, outdated-scan warning
  - **Design** — theme (system / dark / light), accent color, table node corners, monospace font
  - **Graph** — minimap, zoom controls, background pattern, sidebar stats and search match counts, control sizes
  - **AI Models** — placeholder for the planned AI features (see Roadmap)
- Collapsible global navigation and hover-to-preview for saved databases

---

## Tech Stack

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy (async)
- PostgreSQL (cache database)

### Export

- Jinja2
- WeasyPrint
- Markdown

### Frontend

- React + TypeScript (Vite)
- TailwindCSS with a custom design-token system
- TanStack Query (server state) + Zustand (UI state)
- React Flow (`@xyflow/react`) for the schema graph, with Dagre for auto-layout
- `@tanstack/react-virtual` for the virtualized table list
- Lucide icons, `simple-icons` for database-vendor branding

### Infrastructure

- Docker
- Uvicorn

---

## Architecture

TableTrail's backend is currently a **modular monolith**:

```text
Client (Frontend / API consumer)
        ↓
   FastAPI API layer
        ↓
   Service layer (scan, database, export)
        ↓
Repository layer ↔ Cache Database (PostgreSQL)
        ↓
  Scanner adapters (PostgreSQL / MySQL / MariaDB)
        ↓
   Target database being analyzed
```

- **API layer** — request/response handling, input validation
- **Service layer** — orchestrates scanning, persistence, and export logic
- **Repository layer** — encapsulates all database access to the cache database
- **Scanner adapters** — dialect-specific logic for reading schema metadata from each supported database engine

The frontend talks to this API as a standard REST client and does not currently share any code or process with the backend.

---

## Export System

Scanned schemas can be exported in multiple formats through a shared export flow:

```text
Export Request
      ↓
Export Service
      ↓
Export Type (JSON / Markdown / PDF)
      ↓
Generator
      ↓
File Response
```

- **JSON** — the raw structured schema
- **Markdown** — a human-readable schema document
- **PDF** — rendered from an HTML/Jinja2 template via WeasyPrint

Connection details (host, port, database name, username) are left out unless the request sets `include_connection_details` (the "Include connection details" setting in the UI). Stored passwords are never part of an export.

All three formats are produced through the same export service, so adding a new format means adding an export class and registering it for a new export type rather than building a new pipeline.

---

## Roadmap

### AI Reasoning

Planned: the ability to ask questions about a scanned database directly, e.g.

- "Which tables belong to a given business process?"
- "How are these two tables related?"
- "What depends on this table?"
- "Explain this database structure."

This will require careful context-building so that only relevant schema information is passed to the model, rather than dumping the entire schema into every query.

### AI Assistant (Frontend)

Planned: an in-app AI assistant that serves as the user-facing side of the AI reasoning work above.

- **Movable assistant window** — a floating window that can be dragged freely around the workspace, so it can sit next to the graph without blocking it. The AI reasoning conversation takes place inside this window.
- **Configurable provider setup** — in the settings, users choose from a set of predefined API contracts, and select the model and the reasoning effort to use.
- **Saved configurations** — a configuration can be saved in the settings under a custom name together with its API key, so it can be selected again later without re-entering anything.

### Asynchronous Processing

For longer-running operations (large database scans, AI reasoning over big schemas), a move toward:

- a message queue (RabbitMQ)
- background workers
- job management
- event-driven processing

is planned, replacing today's synchronous request/response scanning for large workloads.

### Realtime Workflow

Once jobs run asynchronously, their progress should be visible in the frontend, conceptually:

```text
Job started
   ↓
Database analysis
   ↓
Dependency analysis
   ↓
Context generation
   ↓
AI reasoning
   ↓
Completed
```

Delivered to the frontend via SSE or WebSockets.

### Frontend

Near-term frontend plans build on the current interface rather than starting from scratch: more graph settings (default layout direction, edge style), the AI Models settings once AI reasoning lands, refining the table/column detail views further, and preparing the graph for the context needs of AI reasoning.

---

## Project Status

TableTrail is under active development. The backend covers database scanning, structured persistence, custom relations, and multi-format export, and an interactive frontend exists for exploring and managing scanned databases, including search, custom relations, and a working settings area. Next up is the asynchronous processing and AI reasoning work described in the roadmap.

---

## Getting Started

```bash
git clone https://github.com/jason-wilmanowski/tabletrail.git
cd tabletrail
cp .env.example .env   # then fill in the values
docker-compose up --build
```

This starts the cache database (`db`), the API (`api`) and the frontend (`frontend`), all configured through `.env` — `DATABASE_URL` must use the `postgresql+asyncpg://` driver. The exposed ports come from `FASTAPI_PORT`, `POSTGRES_PORT` and `FRONTEND_PORT`.

To run the apps without Docker:

```bash
# backend (from the repo root)
pip install -r requirements-dev.txt
uvicorn table_trail_backend.main:app --reload

# frontend
cd table-trail-frontend
npm ci
npm run dev
```

The frontend reads the API base URL from `VITE_API_BASE_URL` (default `http://localhost:8000/api/v1`).

### Database migrations

The cache database schema is managed with Alembic and migrated automatically when the API starts. After changing a model in `table_trail_backend/db/models/`, create a migration and review it before committing:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head   # or just restart the API
```

---

## Contributing

TableTrail is still an early-stage, actively developed project without an established contribution process yet. If you're interested in the project, feel free to open an issue to start a conversation — a more formal contribution guide will follow as the project matures.
