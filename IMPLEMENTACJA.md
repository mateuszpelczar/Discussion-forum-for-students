# 🎓 Forum Dyskusyjne dla Studentów

Platforma internetowa umożliwiająca studentom wymianę informacji, zadawanie pytań, prowadzenie dyskusji oraz dzielenie się wiedzą.

## 📋 Spis treści
- [Zespół](#-zespół)
- [Technologie](#-technologie)
- [Funkcjonalności](#-funkcjonalności)
- [Instalacja](#-instalacja)
- [Uruchomienie](#-uruchomienie)
- [Struktura projektu](#-struktura-projektu)
- [API Endpoints](#-api-endpoints)
- [Testy](#-testy)

## 👥 Zespół

- **Mateusz Pelczar** - Kierownik
- Jakub Michalski
- Marcin Markuszka
- Kacper Bęben
- Bartosz Molek

## 🛠 Technologie

### Backend
- Python 3.x
- Django 5.2.8
- Django REST Framework
- PostgreSQL
- JWT Authentication (Simple JWT)

### Frontend
- React 19
- TypeScript
- Vite
- React Router DOM
- Axios

## ✨ Funkcjonalności

### ✅ Zaimplementowane (System autoryzacji)

#### Backend:
- ✅ **Rejestracja użytkowników** z walidacją
- ✅ **Logowanie** z tokenami JWT
- ✅ **Wylogowanie** z blacklistingiem tokenów
- ✅ **Automatyczne odświeżanie tokenów**
- ✅ **Role użytkowników** (USER, ADMIN)
- ✅ **Profile użytkowników** (automatyczne tworzenie)
- ✅ **Aktualizacja profilu** (wydział, rok studiów, opis)
- ✅ **Zmiana hasła**
- ✅ **Zabezpieczenia**: hashowanie haseł (bcrypt), walidacja, CORS

#### Frontend:
- ✅ **Formularz rejestracji** z walidacją
- ✅ **Formularz logowania**
- ✅ **Chronione trasy** (wymaga logowania)
- ✅ **Context API** dla zarządzania stanem autoryzacji
- ✅ **Axios interceptors** - automatyczne dodawanie tokenów
- ✅ **Automatyczne odświeżanie tokenów** przy wygaśnięciu
- ✅ **Responsive design**

#### Testy:
- ✅ **10+ testów jednostkowych** (modele, walidacja)
- ✅ **10+ testów integracyjnych** (API endpoints)

### 🔜 Do zaimplementowania

- Tworzenie wątków dyskusyjnych
- Dodawanie postów i komentarzy
- System głosowania (+1/-1)
- Wyszukiwarka wątków
- Filtrowanie po kategoriach
- Panel administratora
- Zarządzanie kategoriami
- Blokowanie wątków
- Lista aktywnych użytkowników

## 📦 Instalacja

### Wymagania
- Python 3.8+
- Node.js 18+
- PostgreSQL 12+

### Backend

1. Przejdź do katalogu backend:
```bash
cd backend
```

2. Utwórz wirtualne środowisko:
```bash
python -m venv venv
```

3. Aktywuj wirtualne środowisko:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. Zainstaluj zależności:
```bash
pip install -r requirements.txt
```

5. Utwórz plik `.env` na podstawie `.env.example`:
```bash
cp .env.example .env
```

6. Skonfiguruj bazę danych w `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/forum_db
SECRET_KEY=twoj-sekretny-klucz
DEBUG=True
```

7. Wykonaj migracje:
```bash
python manage.py migrate
```

8. Utwórz superużytkownika (opcjonalnie):
```bash
python manage.py createsuperuser
```

### Frontend

1. Przejdź do katalogu frontend:
```bash
cd frontend
```

2. Zainstaluj zależności:
```bash
npm install
```

## 🚀 Uruchomienie

### Backend (Django)

```bash
cd backend
python manage.py runserver
```

Backend będzie dostępny na: `http://localhost:8000`

### Frontend (React)

```bash
cd frontend
npm run dev
```

Frontend będzie dostępny na: `http://localhost:5173`

## 📁 Struktura projektu

```
Discussion-forum-for-students/
├── backend/
│   ├── config/               # Konfiguracja Django
│   │   ├── settings.py      # Ustawienia (JWT, CORS, REST Framework)
│   │   └── urls.py          # Główne URLe
│   ├── users/               # Aplikacja użytkowników
│   │   ├── models.py        # Modele (Uzytkownik, Profil)
│   │   ├── serializers.py   # Serializery DRF
│   │   ├── views.py         # Kontrolery (AutoryzacjaController)
│   │   ├── urls.py          # URLe autoryzacji
│   │   └── tests.py         # Testy jednostkowe i integracyjne
│   ├── forum/               # Aplikacja forum (do zaimplementowania)
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Komponenty React
│   │   │   ├── Logowanie.tsx
│   │   │   ├── Rejestracja.tsx
│   │   │   ├── StronaGlowna.tsx
│   │   │   └── ChronionaTrasa.tsx
│   │   ├── context/         # Context API
│   │   │   └── AuthContext.tsx
│   │   ├── services/        # Serwisy API
│   │   │   └── serwisAutoryzacji.ts
│   │   ├── utils/           # Narzędzia
│   │   │   └── axios.ts     # Konfiguracja Axios + interceptors
│   │   ├── App.tsx          # Główny komponent + routing
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Autoryzacja

#### Rejestracja
```http
POST /api/auth/rejestracja/
Content-Type: application/json

{
  "username": "student123",
  "email": "student@uczelnia.pl",
  "password": "silnehaslo123",
  "password2": "silnehaslo123",
  "first_name": "Jan",
  "last_name": "Kowalski"
}
```

#### Logowanie
```http
POST /api/auth/logowanie/
Content-Type: application/json

{
  "username": "student123",
  "password": "silnehaslo123"
}
```

#### Wylogowanie
```http
POST /api/auth/wylogowanie/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "refresh": "{refresh_token}"
}
```

#### Odświeżenie tokena
```http
POST /api/auth/token/odswiez/
Content-Type: application/json

{
  "refresh": "{refresh_token}"
}
```

#### Pobierz aktualnego użytkownika
```http
GET /api/auth/uzytkownik/
Authorization: Bearer {access_token}
```

#### Aktualizuj profil
```http
PATCH /api/auth/profil/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "first_name": "Jan",
  "profil": {
    "wydzial": "Informatyka",
    "rok_studiow": 3,
    "opis": "Student informatyki"
  }
}
```

#### Zmiana hasła
```http
POST /api/auth/zmien-haslo/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "stare_haslo": "starehaslo123",
  "nowe_haslo": "nowehaslo456",
  "potwierdz_haslo": "nowehaslo456"
}
```

### Użytkownicy

#### Lista użytkowników
```http
GET /api/uzytkownicy/
Authorization: Bearer {access_token}

# Z filtrowaniem:
GET /api/uzytkownicy/?rola=ADMIN
GET /api/uzytkownicy/?search=jan
```

#### Szczegóły użytkownika
```http
GET /api/uzytkownicy/{id}/
Authorization: Bearer {access_token}
```

## 🧪 Testy

### Uruchomienie testów backendu

```bash
cd backend
python manage.py test users
```

### Pokrycie testów:

#### Testy jednostkowe (4+):
- ✅ Test tworzenia użytkownika
- ✅ Test automatycznego tworzenia profilu
- ✅ Test domyślnej roli użytkownika
- ✅ Test unikalności username
- ✅ Test aktualizacji profilu

#### Testy integracyjne (6+):
- ✅ Test rejestracji z poprawnymi danymi
- ✅ Test rejestracji z niezgodnymi hasłami
- ✅ Test rejestracji z istniejącym username
- ✅ Test rejestracji ze słabym hasłem
- ✅ Test logowania z poprawnymi danymi
- ✅ Test logowania z niepoprawnym hasłem
- ✅ Test logowania nieistniejącego użytkownika
- ✅ Test pobierania danych zalogowanego użytkownika
- ✅ Test pobierania danych bez autoryzacji
- ✅ Test aktualizacji profilu

## 🎯 Zasady programowania

Projekt implementuje następujące zasady:

### SOLID:
- **Single Responsibility**: Każdy kontroler odpowiada za jedną funkcjonalność
- **Open/Closed**: Serializery rozszerzalne bez modyfikacji
- **Liskov Substitution**: Dziedziczenie AbstractUser
- **Interface Segregation**: Osobne serializery dla różnych operacji
- **Dependency Inversion**: Użycie DRF abstrakcji

### Clean Code:
- Czytelne nazwy zmiennych i funkcji po polsku
- Krótkie funkcje (max 20-30 linii)
- Komentarze opisujące "dlaczego", nie "co"
- Spójna konwencja nazewnictwa
- Brak duplikacji kodu (DRY)

### KISS & DRY:
- Proste rozwiązania zamiast skomplikowanych
- Reużywalne komponenty i serwisy
- Centralna konfiguracja (axios, settings)

## 📝 Licencja

Projekt edukacyjny - Politechnika

## 📧 Kontakt

W razie pytań skontaktuj się z zespołem projektowym.
