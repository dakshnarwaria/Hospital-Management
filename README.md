# MediCore Hospital Management System (DBMS Project)

A complete, demo-ready Hospital Management System built with **Next.js (App Router, React 19, TypeScript, Tailwind CSS)** and backed by a relational **MySQL** schema (`hospital_db`).

In this project, the **database is the star**: every hospital operation visibly harnesses MySQL capabilities including relational joins, composite constraints, triggers, stored procedures, views, and indexes.

---

## Architecture Overview

```text
Next.js Frontend (Forms, Tables, Charts, Live Demo)
       ▲
       │  fetch() with JSON responses
       ▼
Next.js Backend API (Route handlers: Zod validation + parameterized SQL)
       ▲
       │  mysql2/promise connection pool
       ▼
MySQL 8.0 Engine (hospital_db)
  ├── 8 Relational Tables (departments, doctors, patients, rooms, appointments, admissions, prescriptions, bills)
  ├── 1 View (current_admissions)
  ├── 3 Stored Procedures (book_appointment, admit_patient, discharge_patient)
  ├── 3 Triggers (before_admission, after_admission, after_discharge)
  ├── Indexes (idx_patient_name, idx_appointment_date)
  └── Check & Unique Constraints (prevent invalid fees, duplicate booking slots, duplicate emails)
```

---

## Prerequisites

- **Node.js**: v18.18 or higher (v20+ recommended)
- **npm**: v9+
- **MySQL Server**: v8.0 or higher running locally (or accessible over network)

---

## Teammate Setup Guide

### 1. Database Setup
Ensure your MySQL service is running. Import the schema and seeded data:

```bash
# Using MySQL Command Line Client
mysql -u root -p < db/schema.sql

# Or inside MySQL shell:
mysql -u root -p
mysql> SOURCE db/schema.sql;
```

This creates the `hospital_db` database, tables, stored procedures, triggers, views, and initial seed records.

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Open `.env.local` and set your local MySQL connection credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hospital_db
```

> **Security Note**: Never commit `.env.local` to Git. `.env.local` is included in `.gitignore`.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Live Demo Presentation Script

When demonstrating this project to professors, evaluators, or classmates, follow this guided flow:

### Step 1: Health & Connection Verification
- Visit `http://localhost:3000/api/health` to demonstrate live pooled MySQL connectivity via `SELECT 1 AS healthy`.

### Step 2: Executive Dashboard (`/`)
- **6 Real-Time KPIs**: Total patients, active doctors, today's appointments, current inpatients, room occupancy percentage, and total outstanding pending dues.
- **Recharts Analytics**:
  - Bar Chart: Total appointments scheduled per physician.
  - Donut Chart: Bed capacity vs utilization across General, Private, and ICU wards.
- **Recent Feeds**: Live appointments and active admissions directly querying the database.

### Step 3: Database Insights & Interactive Demo Engine (`/insights`)
Navigate to the **DB Insights & Demo** page in the sidebar:
1. **Interactive Demo Mode**:
   - **Click "1. Book Appt"**: Executes `CALL book_appointment(p_patient, p_doctor, CURDATE(), time, reason)`. Demonstrates parameter validation and slot booking.
   - **Click "2. Fill Room"**: Executes `CALL admit_patient(...)` into an available room. Trigger `after_admission` immediately increments `rooms.occupied`.
   - **Click "3. Trigger Error"**: Attempts to admit a patient into a full room. Demonstrates trigger `before_admission` rejecting the write with `SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room is full'`. Clean error toast appears in the UI.
   - **Click "4. Discharge & Drop"**: Executes `CALL discharge_patient(admission_id)`. Trigger `after_discharge` auto-decrements `rooms.occupied` and frees up the bed.
2. **Analytical SQL Showcase**:
   - Inspect live query results alongside the raw SQL statements:
     - Pending dues per patient (`GROUP BY`, `SUM`)
     - Doctors per department with average consultation fee
     - Revenue breakdown by bill category (`Consultation`, `Admission`, `Medicine`, `Lab`)
     - Busiest doctors ranked by appointment volume
     - Inpatients queried from the MySQL VIEW `current_admissions`
     - Room occupancy and bed availability

### Step 4: Patient Medical Profile (`/patients/[id]`)
- Open the Patient Directory and click on any patient (e.g. Aarav Sharma).
- View their multi-table history: demographics, scheduled appointments, inpatient stays, prescriptions, and pending bills.
- Toggle bill payment status between **Pending** and **Paid** with one click.

### Step 5: Department & Room Integrity Controls
- **Rooms (`/rooms`)**: Visual capacity bars showing real-time occupancy.
- **Doctors & Departments (`/doctors`)**: Try deleting a department that currently has doctors assigned; observe the clean error message preventing foreign key constraint violation.

---

## Project Structure

```text
hospital-management/
├── .env.example              # Environment variables template
├── db/
│   └── schema.sql            # Master database schema, procedures, triggers, views & seed data
├── lib/
│   ├── db.ts                 # Pooled mysql2/promise connection manager
│   ├── errors.ts             # MySQL error & SQLSTATE 45000 translator
│   └── validators.ts         # Zod schemas for all models & actions
├── components/
│   ├── dashboard-shell.tsx   # Client wrapper for layout
│   ├── theme-provider.tsx    # next-themes provider
│   ├── theme-toggle.tsx      # Dark/Light mode switcher
│   ├── sidebar.tsx           # Collapsible responsive sidebar
│   ├── navbar.tsx            # Top navigation bar
│   ├── stat-card.tsx         # KPI card with green gradient styling
│   ├── data-table.tsx        # Searchable, sortable, paginated table
│   ├── modal.tsx             # Accessible dialog component
│   ├── confirm-dialog.tsx    # Deletion confirmation modal
│   └── skeleton-loader.tsx   # Loading and empty states
├── app/
│   ├── globals.css           # Green-to-black/white palette & gradient styles
│   ├── layout.tsx            # Root layout with Toaster and Theme provider
│   ├── (dashboard)/
│   │   ├── page.tsx          # Executive Dashboard (KPIs & Recharts)
│   │   ├── patients/         # Patient list & profile detail pages
│   │   ├── doctors/          # Doctors and departments management
│   │   ├── rooms/            # Room cards & bed availability bars
│   │   ├── appointments/     # CALL book_appointment scheduler
│   │   ├── admissions/       # VIEW current_admissions & discharge manager
│   │   ├── prescriptions/    # Medication records per appointment
│   │   ├── bills/            # Billing tracker & status toggles
│   │   └── insights/         # Raw SQL reports & Live Demo Engine
│   └── api/
│       ├── health/           # Connection check (SELECT 1)
│       ├── stats/            # Dashboard metrics & analytics
│       ├── patients/         # Patient CRUD
│       ├── doctors/          # Doctor CRUD
│       ├── departments/      # Department CRUD
│       ├── rooms/            # Room CRUD
│       ├── appointments/     # CALL book_appointment
│       ├── admissions/       # VIEW current_admissions & CALL admit_patient
│       ├── admissions/discharge/ # CALL discharge_patient
│       ├── prescriptions/    # Prescription CRUD
│       ├── bills/            # Billing statements & status updates
│       ├── insights/         # Raw DBMS report executions
│       └── demo/             # Guided demo workflow runner
```

---

## Build & Test Commands

```bash
# Verify TypeScript and Next.js build
npm run build

# Run ESLint validation
npm run lint

# Start production server
npm run start
```
