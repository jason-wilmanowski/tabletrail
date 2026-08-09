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

- **Database scanning** for PostgreSQL, MySQL, and MariaDB — reads tables, columns, data types, primary keys, foreign keys, and constraints directly from the source database
- **Persistent schema cache** — scanned structures are stored in their own database (not re-scanned on every request), organized as a layered schema: databases → tables → columns → constraints
- **Full CRUD** for managed database connections (create via scan, read, update connection details, delete)
- **Rescan** support to refresh an already-scanned database's structure
- **Search** across tables and columns within a scanned database
- **Export system** for scanned schemas, currently supporting **JSON**, **Markdown**, and **PDF** (PDF generated via Jinja2 templates rendered through WeasyPrint)
- Structured service/repository layering with centralized exception handling

### Frontend

A dark-themed, developer-tool-styled web interface, built as a single-page application:

- **Interactive schema graph** — every table renders as a node showing its columns, data types, and primary/foreign key indicators, with foreign-key relationships drawn as edges between tables; auto-laid-out via Dagre, pan/zoom/minimap included
- **Table inspector panel** — click any table to see its full column and constraint details
- **Sidebar with live search and schema grouping** — a virtualized, filterable list of tables grouped by schema, built to stay responsive even on databases with hundreds of tables
- **Connection management** — add a new database connection through a guided form (with per-type validation and branded database-type icons), view all connected databases, and edit or delete a connection
- **Database detail workspace** — combines the schema graph, table sidebar, and connection details (host, port, credentials) in one view, including rescan and delete actions
- Collapsible global navigation, hover-to-preview for saved databases, and a settings area scaffold (Design / General / Graph / AI Models tabs prepared, not yet functional)

> The frontend is under active iteration — some actions in the UI (such as certain settings tabs) are present as interface scaffolding ahead of their backend wiring.

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

All three formats are produced through the same export service, so adding a new format means adding a new generator rather than a new pipeline.

---

## Roadmap

### AI Reasoning

Planned: the ability to ask questions about a scanned database directly, e.g.

- "Which tables belong to a given business process?"
- "How are these two tables related?"
- "What depends on this table?"
- "Explain this database structure."

This will require careful context-building so that only relevant schema information is passed to the model, rather than dumping the entire schema into every query.

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

Near-term frontend plans build on the current interface rather than starting from scratch: wiring up the remaining settings tabs, refining the table/column detail views further, and preparing the graph for the context needs of AI reasoning once that lands.

---

## Project Status

TableTrail is under active development. The backend already covers database scanning, structured persistence, and multi-format export, and a full interactive frontend now exists for exploring and managing scanned databases. Current work is focused on connecting remaining UI actions to the backend and rounding out the settings area, ahead of the asynchronous processing and AI reasoning work described in the roadmap.

---

## Getting Started

> Setup steps depend on your local `.env` configuration and Docker setup. Refer to the repository's `docker-compose` configuration and environment file(s) for exact service names and required variables before running the commands below.

```bash
git clone https://github.com/jason-wilmanowski/tabletrail.git
cd tabletrail
docker-compose up --build
```

This starts the API and its cache database. The frontend is a separate Vite application; see its own directory for `npm install` / `npm run dev` instructions.

---

## Contributing

TableTrail is still an early-stage, actively developed project without an established contribution process yet. If you're interested in the project, feel free to open an issue to start a conversation — a more formal contribution guide will follow as the project matures.