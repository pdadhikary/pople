# Pople

A self-hosted web platform for submitting, running, and monitoring **ORCA** quantum
chemistry geometry-optimization jobs. Named after John Pople, Nobel laureate and
pioneer of computational chemistry.

## What it is

Pople wraps the [ORCA](https://www.faccts.de/orca/) ab-initio quantum chemistry
package in a multi-service web application. You upload an ORCA input file
(`.inp`) through a browser UI; a background worker runs ORCA, parses its output
**as it is produced**, and streams per-step convergence metrics, SCF energies,
and 3D molecular geometries into a database. A SvelteKit dashboard then lets you
watch the optimization converge in real time — energy and gradient charts,
convergence thresholds, a scrubable 3D molecular viewer, and downloadable
artifacts — instead of tailing a terminal and grepping `.out` files by hand.

## What it does

- **Submit jobs** from the web UI by uploading an ORCA input file.
- **Queue and execute** jobs through a Postgres-backed queue with row-level
  locking, so multiple workers can claim jobs without collisions.
- **Parse ORCA output incrementally** with a state-machine parser that extracts:
  - Cartesian coordinates at each optimization step
  - Geometry-convergence metrics (energy change, RMS/MAX gradient, RMS/MAX step)
    with their convergence thresholds and YES/NO flags
  - Total SCF energy per step
- **Visualize results live** in the browser:
  - SCF energy chart
  - Convergence chart plotted against thresholds
  - 3D molecular viewer (3Dmol.js) with a slider to scrub through geometry steps
  - Atomic coordinate table and the original input file
- **Manage outputs**: browse and download generated files (`.out`, `.xyz`,
  `.trj`, `.allxyz`, `.hess`, `.engrad`, `.molden.input`, `.inp`, etc.)
  individually or as a ZIP, view the raw ORCA log, and cancel jobs.
- **Time out** runaway jobs (default 3 days) and surface errored runs.

## Why it is useful

Running geometry optimizations conventionally means babysitting a shell,
manually inspecting `.out` files for convergence, and juggling `.xyz`/`.trj`
files to view structures. Pople turns this into a shared, persistent dashboard:
researchers and labs can submit many optimizations, monitor them from anywhere,
inspect convergence and 3D structure at any step, and retrieve artifacts — all
without SSH access to the compute host or ORCA expertise at the command line.

## Architecture

Pople is a **`uv`-workspace Python monorepo** (Python 3.14) plus a standalone
SvelteKit app, orchestrated with Docker Compose.

```
            ┌──────────┐   REST    ┌──────────┐   poll    ┌──────────┐
            │  web     │ ────────▶ │   api    │ ◀──────── │  browser │
            │ SvelteKit│           │ FastAPI  │           │  charts  │
            └──────────┘           └────┬─────┘           │ 3Dmol.js │
                                        │ SQLModel        └──────────┘
                                        ▼
                                 ┌──────────┐   NOTIFY    ┌──────────┐
                                 │ postgres │ ◀────────── │  worker  │
                                 │   18     │             │  ORCA +  │
                                 └──────────┘             │  parser  │
                                                          └──────────┘
```

### Services (`compose.yaml`)

| Service  | Stack                                          | Port  | Role |
|----------|------------------------------------------------|-------|------|
| `web`    | SvelteKit + TypeScript + TailwindCSS           | 3000  | Browser dashboard; Chart.js plots, 3Dmol.js viewer, polls API for live updates |
| `api`    | FastAPI + SQLModel                             | 8000  | REST API under `/jobs` (list, create, cancel, files, optimization, geometry, ZIP). Includes WebSocket `ConnectionManager` + Pydantic message schemas and request-logging middleware |
| `worker` | Python + ORCA 6.1.1 + OpenMPI 4.1.8            | —     | Polls Postgres for queued jobs (`SELECT ... FOR UPDATE SKIP LOCKED`), spawns ORCA, streams stdout, parses it, and persists metrics/geometry/status |
| `postgres` | PostgreSQL 18                                | 5433  | Jobs, metrics, geometry steps; `LISTEN/NOTIFY` triggers push inserts/status changes to subscribers |

### Shared packages (`packages/`)

- **`orca`** — Incremental, state-machine parser for ORCA output. Builder
  pattern + pub/sub: register `convergence_updates`, `energy_updates`, and
  `geometry_updates` callbacks that fire as each block is parsed line-by-line.
- **`database`** — SQLModel models (`Job`, `JobMetric`, `GeometryStep`, `Atom`),
  session/engine helpers, and Alembic migrations (initial schema + `pg_notify`
  triggers on `job`, `jobmetric`, `geometrystep`).
- **`pople-logging`** — Shared rotating text + JSONL logging and a FastAPI
  request-logging middleware used by both `api` and `worker`.

### Data flow

1. Browser submits an `.inp` file → `api` writes the job row (`queued`) and
   saves the input under `jobs/<name>/<name>.inp`.
2. `worker` claims the job (`running`), runs `orca <input>.inp`, and reads
   stdout line-by-line.
3. `OrcaParser` dispatches each parsed block to callbacks that insert
   `JobMetric` / `GeometryStep` rows and update `Job.status`.
4. Postgres triggers `pg_notify` on the `job_control`, `job_metrics`, and
   `job_geometry` channels; `api` relays updates to connected WebSockets.
5. `web` polls the REST endpoints (every few seconds while a job is queued or
   running) and re-renders charts, the 3D viewer, and the coordinate table.

## Installation

### Prerequisites

- **Docker** and **Docker Compose**
- **ORCA** — the worker image builds ORCA from a tarball you must supply.
  ORCA is free for academic use; download
  `orca_6_1_1_linux_x86-64_shared_openmpi418_nodmrg.tar.xz` from the FACCTS
  registration portal and place it in `orca_bin/`:

  ```
  orca_bin/
  └── orca_6_1_1_linux_x86-64_shared_openmpi418_nodmrg.tar.xz
  ```

  OpenMPI 4.1.8 is built from source inside the worker image, so no separate
  MPI install is required on the host.

### Configure

A root `.env` file drives all services. The defaults work out of the box with
`compose.yaml`:

```env
JOBS_DIR=/jobs
FAVICON=/workspace/apps/api/static/images/favicon.png
MAX_UPLOAD_BYTES=1048576
POPLE_LOG_DIR=/logs
LOG_LEVEL=INFO
DB_USER=pople
DB_NAME=pople_db
DB_PASSWORD=pople123
DB_HOST=postgres
DB_PORT=5432
JOB_TIMEOUT_SECONDS=259200
```

### Run

```sh
docker compose up --build
```

This starts `postgres`, `api`, `worker`, and `web`. The first build compiles
OpenMPI and installs ORCA, so expect it to take a while.

| Service  | URL                        |
|----------|----------------------------|
| Web UI   | http://localhost:3000      |
| API      | http://localhost:8000      |
| Postgres | localhost:5433             |

### Database migrations

Migrations live in `packages/database/alembic/` and are managed with Alembic.
To apply them against the running Postgres container:

```sh
docker compose exec api uv run --directory packages/database alembic upgrade head
```

> Note: the worker image bundles its own copy of the `orca` package source, and
> the `web` app is excluded from the Python workspace (it has its own Node
> toolchain).

## Tutorial

### 1. Open the dashboard

Visit http://localhost:3000 — you are redirected to the **Jobs** page, which
lists submitted optimizations with status, queue/start/finish timestamps, and
filter/pagination controls. The list auto-refreshes while there is activity.

### 2. Submit a job

1. Click **New Job**.
2. Enter a **job name** (1–20 chars, alphanumeric plus `-` and `_`; must start
   with a letter or digit and be unique).
3. Upload an ORCA input file (`.inp`). For example, a simple ethane geometry
   optimization:

   ```
   ! BP def2-SVP def2/J Opt
   *xyz 0 1
       C  0.277784  0.000000 -4.653972
       H  0.277784  1.019690 -5.053228
       H  1.160862 -0.509845 -5.053228
       H -0.605294 -0.509845 -5.053228
       C  0.277784  0.000000 -3.123984
       H -0.377660  0.781128 -2.724728
       H -0.070971 -0.958195 -2.724728
       H  1.281983  0.177067 -2.724728
   *
   ```

   A file preview is shown before submission.
4. Click **Submit Job**. You are redirected to the job's detail page.

### 3. Watch it run

The job detail page updates every few seconds while the job is `queued` or
`running`:

- **SCF Energy** chart — total energy per optimization step.
- **Convergence** chart — energy change, RMS/MAX gradient, and RMS/MAX step
  plotted against ORCA's convergence thresholds.
- **Molecular Geometry** panel — a 3D viewer (drag to rotate, scroll to zoom)
  with a slider to scrub through each optimization step, plus a copy-to-XYZ
  button and an atomic coordinate table.
- **Input File** — the original `.inp` for reference.

Status moves `queued` → `running` → `finished` (or `error` / `cancelled`).

### 4. Retrieve results

- From the job's **Files** tab, download any generated file (`.out`, `.xyz`,
  `.trj`, `.allxyz`, `.hess`, `.engrad`, `.molden.input`, `.inp`) individually,
  or grab everything as a **ZIP**.
- The **Log** tab shows the raw ORCA stdout as written by the worker.
- Use **Cancel** to remove a queued or running job.

### 5. Tips

- Job working directories and outputs persist under `./jobs/<name>/` on the
  host (mounted into `api` and `worker`), and logs under `./logs/`.
- Increase `MAX_UPLOAD_BYTES` in `.env` if your input files are large.
- Tune `JOB_TIMEOUT_SECONDS` to bound long-running optimizations.
