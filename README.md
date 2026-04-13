# Discussion Forum for Students

A full-stack web application — a discussion forum designed for students. Users can browse and create discussion threads, write posts, vote on content, and manage their profiles. Administrators can manage categories, threads, and users.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Vite, React Router DOM 7, Axios |
| Backend | Python 3.11, Django 5.2, Django REST Framework 3.15 |
| Auth | JWT (djangorestframework-simplejwt) |
| Database | PostgreSQL |
| Containerization | Docker + Docker Compose |
| Web server | Nginx (frontend SPA) |

---

## Getting Started

### Option 1 — Docker (recommended)

**Prerequisites:** Docker Desktop installed and running.

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/Discussion-forum-for-students.git
   cd Discussion-forum-for-students
   ```

2. Create the backend environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Then open `backend/.env` and fill in your values:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/forum_db
   SECRET_KEY=your-secret-django-key
   DEBUG=True
   ```

3. Build and start all services:
   ```bash
   docker-compose up --build
   ```

4. In a separate terminal, apply database migrations:
   ```bash
   docker exec django_backend python manage.py migrate
   ```

5. (Optional) Create an admin account:
   ```bash
   docker exec -it django_backend python manage.py createsuperuser
   ```

**Running services:**

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api |
| Django Admin | http://localhost:8000/admin |
| PgAdmin | http://localhost:8080 (login: `admin@admin.com` / `admin`) |

To stop: `docker-compose down`

---

### Option 2 — Local (without Docker)

**Prerequisites:** Python 3.11+, Node.js 18+, a running PostgreSQL instance.

#### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Linux/macOS
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, SECRET_KEY, DEBUG

# Apply migrations and start
python manage.py migrate
python manage.py runserver
```

Backend runs at: http://localhost:8000

#### Frontend

```bash
cd frontend

npm install
npm run dev
```

Frontend runs at: http://localhost:5173

> **Note:** When running locally, the frontend connects to the backend at `localhost:8000`. CORS is pre-configured for both `:5173` (Vite dev) and `:3000`.

---

## Architecture

### Overview

```
┌─────────────────┐        HTTP/REST        ┌──────────────────────┐
│   React SPA     │ ──────────────────────► │  Django REST API     │
│  (Vite / Nginx) │ ◄────────────────────── │  + JWT Auth          │
└─────────────────┘      JSON responses     └──────────┬───────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   PostgreSQL    │
                                               └─────────────────┘
```

### Backend Structure

```
backend/
├── config/          # Django settings, root URL conf
├── users/           # Auth, user model, profiles, admin user mgmt
│   ├── models.py    # Uzytkownik (CustomUser), Profil
│   ├── views.py     # AutoryzacjaController, ProfilController, AdminController
│   └── urls.py      # /api/auth/*, /api/uzytkownicy/*, /api/admin/uzytkownicy/*
└── forum/           # Core forum logic
    ├── models.py    # Kategoria, Watek, Post, Glos
    ├── services.py  # Business logic layer (KategoriaService, WatekService, etc.)
    ├── views.py     # ForumController, AdminController
    ├── serializers.py
    ├── permissions.py
    └── urls.py      # /api/forum/*
```

**Pattern:** Views handle HTTP, Services handle business logic. Views call services; services interact with models directly.

### Frontend Structure

```
frontend/src/
├── context/         # AuthContext — global auth state (user, login, logout)
├── services/        # API calls (serwisAutoryzacji, serwisForumService, serwisUzytkownikowService)
├── utils/           # Centralized Axios instance with JWT interceptor
├── components/      # All React page and UI components
└── App.tsx          # Root router + ChronionaTrasa (protected route wrapper)
```

**Auth flow:**
1. Login → backend returns `access_token` + `refresh_token`
2. Tokens stored in `localStorage`
3. Axios interceptor attaches `Authorization: Bearer <token>` to every request
4. On 401 → interceptor auto-refreshes the token and retries the request
5. Logout → blacklists refresh token server-side, clears `localStorage`

### Database Schema

```
Uzytkownik ──1:1──► Profil
     │
     ├──1:N──► Watek ──FK──► Kategoria
     │              └──1:N──► Post ──1:N──► Glos
     └──1:N──► Post
     └──1:N──► Glos
```

- `Uzytkownik` extends Django's `AbstractUser`, adds `rola` field (`USER` / `ADMIN`)
- `Profil` is auto-created via a Django signal on user save
- `Glos` has a `unique_together` constraint — one vote per user per post
- `Watek` has a `zablokowany` (blocked) flag manageable by admins

---

## API Reference

### Auth — `/api/auth/`

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| POST | `/auth/rejestracja/` | Register new user | No |
| POST | `/auth/logowanie/` | Login, returns JWT tokens | No |
| POST | `/auth/wylogowanie/` | Logout (blacklists token) | Yes |
| POST | `/auth/token/odswiez/` | Refresh access token | No |
| GET | `/auth/uzytkownik/` | Get current user info | Yes |
| PUT | `/auth/profil/` | Update profile | Yes |
| POST | `/auth/zmien-haslo/` | Change password | Yes |

### Users — `/api/uzytkownicy/`

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| GET | `/uzytkownicy/` | List all users | Yes |
| GET | `/uzytkownicy/<id>/` | User details | Yes |
| PATCH | `/admin/uzytkownicy/<id>/` | Edit user (admin) | Admin |
| POST | `/admin/uzytkownicy/<id>/zablokuj/` | Block user (admin) | Admin |
| POST | `/admin/uzytkownicy/<id>/odblokuj/` | Unblock user (admin) | Admin |

### Forum — `/api/forum/`

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| GET | `/forum/kategorie/` | List categories | No |
| GET | `/forum/watki/` | List threads | No |
| POST | `/forum/watki/nowy/` | Create thread | Yes |
| GET | `/forum/watki/<id>/` | Thread details | No |
| GET | `/forum/watki/<id>/posty/` | Posts in thread | No |
| POST | `/forum/watki/<id>/posty/nowy/` | Create post | Yes |
| PUT | `/forum/posty/<id>/` | Edit post | Yes (owner) |
| DELETE | `/forum/posty/<id>/usun/` | Delete post | Yes (owner) |
| POST | `/forum/posty/<id>/glosuj/` | Vote on post (+1/-1) | Yes |
| GET/POST | `/forum/admin/kategorie/` | Manage categories | Admin |
| PUT/DELETE | `/forum/admin/kategorie/<id>/` | Edit/delete category | Admin |
| POST | `/forum/admin/watki/<id>/zablokuj/` | Lock thread | Admin |
| DELETE | `/forum/admin/watki/<id>/` | Delete thread | Admin |
| GET | `/forum/admin/statystyki/` | Forum statistics | Admin |

---

## Running Tests

```bash
cd backend

python manage.py test                    # all tests (42 total)
python manage.py test forum              # forum app only
python manage.py test users              # users app only
python manage.py test forum.tests.WatekServiceTest          # single class
python manage.py test forum.tests.WatekServiceTest.test_tworzenie_watku  # single test
python manage.py test --verbosity=2      # with details
```

The test suite contains **16 unit tests** (service layer, using `unittest.mock`) and **26 integration tests** (API endpoints using DRF `APITestCase`).

---

## Environment Variables

Create `backend/.env` based on `backend/.env.example`:

```env
DATABASE_URL=postgresql://user:password@host:5432/forum_db
SECRET_KEY=your-secret-django-key
DEBUG=True
```

> For production set `DEBUG=False` and use a strong, unique `SECRET_KEY`.

<img width="1854" height="710" alt="image" src="https://github.com/user-attachments/assets/188bbea1-f212-47ff-b5a6-6553868cc151" />
<img width="1487" height="821" alt="image" src="https://github.com/user-attachments/assets/d7ffe91f-aab4-4706-ae09-c22364cbfee2" />
<img width="907" height="627" alt="image" src="https://github.com/user-attachments/assets/9380f5ae-d496-493e-a6eb-9c7ab73802f9" />
<img width="761" height="796" alt="image" src="https://github.com/user-attachments/assets/3e0eb975-f17e-4b88-9a6b-7aa5d7aaa385" />
<img width="892" height="486" alt="image" src="https://github.com/user-attachments/assets/930ea919-d554-4fe5-8a7e-1171d364626a" />
<img width="1096" height="438" alt="image" src="https://github.com/user-attachments/assets/06187155-fe40-4bd2-a36d-f438326984a5" />

