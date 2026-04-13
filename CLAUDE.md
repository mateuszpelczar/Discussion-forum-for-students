# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A student discussion forum web application with a Django REST Framework backend and React + TypeScript frontend. The project is written with Polish naming conventions throughout (models, services, components, API endpoints).

## Commands

### Backend (Django)
```bash
cd backend
python manage.py runserver          # Dev server on :8000
python manage.py migrate            # Apply migrations
python manage.py makemigrations     # Create new migrations
python manage.py createsuperuser    # Create admin user

# Testing
python manage.py test               # Run all tests
python manage.py test forum.tests   # Run specific app tests
python manage.py test forum.tests.KategoriaServiceTest              # Specific class
python manage.py test forum.tests.KategoriaServiceTest.test_tworzenie_kategorii  # Single test
python manage.py test --verbosity=2 # With details
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev       # Dev server on :5173
npm run build     # Production build
npm run lint      # ESLint check
npm run preview   # Preview production build
```

### Docker
```bash
docker-compose up --build   # Start all services
docker-compose down         # Stop
# Services: backend :8000, frontend :3000, pgadmin :8080 (admin@admin.com / admin)
```

## Architecture

### Backend (`backend/`)
- **Framework**: Django 5.2 + DRF 3.15 with JWT auth (`djangorestframework-simplejwt`)
- **Database**: PostgreSQL (configured via `DATABASE_URL` in `.env`)
- **Pattern**: Views → Services → Models (business logic in service layer)
  - `forum/services.py`: `KategoriaService`, `WatekService`, `PostService`, `StatystykiService`
  - Views delegate to services; services do not import views
- **Auth**: Custom user model `Uzytkownik` (extends `AbstractUser`) in `users/` app, role field: `USER` or `ADMIN`
- **Key apps**: `forum/` (categories, threads, posts, voting), `users/` (auth, profiles)
- **Signals**: `Profil` auto-created on `Uzytkownik` post-save

### Frontend (`frontend/src/`)
- **Framework**: React 19 + TypeScript with Vite
- **Routing**: React Router DOM 7 (client-side SPA, Nginx handles fallback)
- **Global state**: `AuthContext` (`context/AuthContext.tsx`) — user, login, logout, loading
- **Token storage**: `localStorage` (access + refresh JWT tokens)
- **HTTP**: Centralized Axios instance (`utils/axios.ts`) with 401 interceptor that auto-refreshes tokens
- **API services**: `services/serwisAutoryzacji.ts`, `services/serwisForumService.ts`, `services/serwisUzytkownikowService.ts`
- **Protected routes**: `ChronionaTrasa` component wraps routes requiring auth; admin routes check `rola === 'ADMIN'`

### API Endpoints Pattern
- Auth: `/api/auth/rejestracja/`, `/api/auth/logowanie/`, `/api/auth/odswiezenie/`
- Forum: `/api/forum/kategorie/`, `/api/forum/watki/`, `/api/forum/posty/`
- Admin: `/api/uzytkownicy/admin/`

### Testing
- **42 tests total**: 16 unit (Mock-based services) + 26 integration (API endpoints)
- Unit tests use `unittest.mock` to isolate service layer
- Integration tests use DRF `APITestCase` with real DB operations
- Test files: `backend/forum/tests.py`, `backend/users/tests.py`

## Key Conventions

- **Polish naming**: All models, services, components, and API endpoints use Polish names (e.g., `Watek` = thread, `Post` = post, `Uzytkownik` = user, `Kategoria` = category, `Glos` = vote)
- **CORS**: `localhost:5173` (Vite dev) is in `ALLOWED_ORIGINS`; configured in `backend/config/settings.py`
- **Environment**: Backend requires `.env` with `DATABASE_URL`, `SECRET_KEY`, `DEBUG` — copy from `.env.example`
