# MorataFMS Workspace Guidelines

These rules apply to the whole repository.

Use this file for cross-stack guidance only. Detailed implementation rules live in the scoped files:

- `backend/AGENTS.md` for Laravel backend work
- `frontend/AGENTS.md` for React frontend work

## Project Overview

MorataFMS is a full-stack operations system for F.M. Morata. It supports brokerage and legal workflows, with the core platform focused on:

- import and export transaction tracking
- client and user management
- document handling and archiving
- audit visibility
- role-based access across brokerage and legal modules

## Workspace Map

- `backend/` is a Laravel 12 API using Sanctum
- `frontend/` is a Vite + React + TypeScript application that consumes the backend API

## Instruction Hierarchy

Follow instructions in this order:

1. direct user request
2. this root `AGENTS.md`
3. the nearest scoped `AGENTS.md`

Use the nearest scoped file when working inside that part of the repo. Do not duplicate backend- or frontend-specific rules into the root file.

`GEMINI.md` mirrors this root file for Gemini-oriented tooling. Keep the two aligned.

## Source Of Truth Rules

If documentation conflicts with the current codebase:

- trust the live code and the scoped `AGENTS.md` files first

If backend and frontend drift, the backend API contract is the source of truth for:

- auth roles
- permissions
- resource payloads
- validation and business rules

## Current Cross-Stack Invariants

These conventions are final unless intentionally changed across the stack:

- auth roles are only `encoder`, `paralegal`, and `admin`
- the current deployed split frontend/backend setup uses temporary Sanctum bearer-token auth; the intended long-term target is Sanctum cookie-based SPA auth once a purchased shared-root domain exists
- `job_title` is display metadata, not an authorization role
- the frontend should consume backend `role`, `departments`, and `permissions` rather than infer access ad hoc
- backend contract changes must update frontend types, API helpers, hooks, and affected UI in the same workstream

Do not reintroduce deprecated auth role names in either layer.

## Required Change Workflow

Before creating or modifying code:

1. inspect sibling files first
2. reuse existing naming, structure, and helpers
3. check whether the work belongs in `backend/` or `frontend/` scoped rules
4. make the smallest clean change that fits current architecture

Do not invent a new pattern when the repository already has one.

## Architecture Guardrails

- do not add new top-level folders without approval
- do not add or replace dependencies without approval
- do not create duplicate route registries, auth logic, or API layers
- do not keep backward-compatibility hacks once the real contract has been normalized

Prefer layered clarity over clever abstractions.

## Verification

After changes:

- backend-only changes: run the relevant backend verification from `backend/AGENTS.md`
- frontend-only changes: run the relevant frontend verification from `frontend/AGENTS.md`
- cross-stack or API contract changes: verify both backend and frontend

## Documentation Discipline

Do not create extra documentation files unless explicitly requested.

Keep this root file concise. Detailed implementation rules belong in scoped files close to the code they govern.

## Reference Files

Use these when you need context:

- `AUTH_ARCHITECTURE.md` for the current temporary bearer-token mode and the future cookie-auth rollback plan
- `backend/AGENTS.md` for Laravel-specific rules
- `frontend/AGENTS.md` for React-specific rules
