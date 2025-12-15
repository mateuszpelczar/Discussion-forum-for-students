"""
Testy dla aplikacji users.
Testy jednostkowe i integracyjne dla autoryzacji.

Zgodnie z wymaganiami projektu:
- Minimum 2 testy jednostkowe
- Minimum 2 testy integracyjne

Zgodnie z zasadami Clean Code:
- Każdy test testuje jedną funkcjonalność (Single Responsibility)
- Nazwy testów jasno opisują co testują
- Testy są niezależne od siebie
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import Uzytkownik, Profil


class UzytkownikModelTest(TestCase):
    """
    Testy jednostkowe dla modelu Uzytkownik.
    """
    
    def test_utworzenie_uzytkownika(self):
        """
        Test sprawdza czy użytkownik jest poprawnie tworzony.
        """
        uzytkownik = Uzytkownik.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        
        self.assertEqual(uzytkownik.username, 'testuser')
        self.assertEqual(uzytkownik.email, 'test@example.com')
        self.assertTrue(uzytkownik.check_password('testpassword123'))
        self.assertEqual(uzytkownik.rola, Uzytkownik.Rola.UZYTKOWNIK)
        self.assertTrue(uzytkownik.is_active)
    
    def test_automatyczne_tworzenie_profilu(self):
        """
        Test sprawdza czy profil jest automatycznie tworzony dla nowego użytkownika.
        """
        uzytkownik = Uzytkownik.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpassword123'
        )
        
        # Sprawdzenie czy profil został utworzony
        self.assertTrue(hasattr(uzytkownik, 'profil'))
        self.assertIsNotNone(uzytkownik.profil)
        self.assertIsInstance(uzytkownik.profil, Profil)
    
    def test_domyslna_rola_uzytkownika(self):
        """
        Test sprawdza czy domyślna rola użytkownika to USER.
        """
        uzytkownik = Uzytkownik.objects.create_user(
            username='testuser3',
            email='test3@example.com',
            password='testpassword123'
        )
        
        self.assertEqual(uzytkownik.rola, Uzytkownik.Rola.UZYTKOWNIK)
    
    def test_unikalnosc_username(self):
        """
        Test sprawdza czy username musi być unikalny.
        """
        Uzytkownik.objects.create_user(
            username='uniqueuser',
            email='unique1@example.com',
            password='testpassword123'
        )
        
        # Próba utworzenia użytkownika z tym samym username
        with self.assertRaises(Exception):
            Uzytkownik.objects.create_user(
                username='uniqueuser',
                email='unique2@example.com',
                password='testpassword123'
            )


class ProfilModelTest(TestCase):
    """
    Testy jednostkowe dla modelu Profil.
    """
    
    def setUp(self):
        """
        Przygotowanie danych testowych.
        """
        self.uzytkownik = Uzytkownik.objects.create_user(
            username='profiletest',
            email='profile@example.com',
            password='testpassword123'
        )
    
    def test_aktualizacja_profilu(self):
        """
        Test sprawdza czy dane profilu można aktualizować.
        """
        profil = self.uzytkownik.profil
        profil.wydzial = 'Informatyka'
        profil.rok_studiow = 3
        profil.opis = 'Student informatyki'
        profil.save()
        
        # Odświeżenie z bazy danych
        profil.refresh_from_db()
        
        self.assertEqual(profil.wydzial, 'Informatyka')
        self.assertEqual(profil.rok_studiow, 3)
        self.assertEqual(profil.opis, 'Student informatyki')


class RejestracjaAPITest(APITestCase):
    """
    Testy integracyjne dla endpointu rejestracji.
    """
    
    def setUp(self):
        """
        Przygotowanie klienta API.
        """
        self.client = APIClient()
        self.rejestracja_url = reverse('users:rejestracja')
    
    def test_rejestracja_poprawne_dane(self):
        """
        Test integracyjny: Rejestracja z poprawnymi danymi.
        """
        dane = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'StrongPassword123!',
            'password2': 'StrongPassword123!',
            'first_name': 'Jan',
            'last_name': 'Kowalski'
        }
        
        response = self.client.post(self.rejestracja_url, dane, format='json')
        
        # Sprawdzenie statusu odpowiedzi
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Sprawdzenie czy odpowiedź zawiera tokeny
        self.assertIn('tokeny', response.data)
        self.assertIn('access', response.data['tokeny'])
        self.assertIn('refresh', response.data['tokeny'])
        
        # Sprawdzenie czy użytkownik został utworzony w bazie
        self.assertTrue(
            Uzytkownik.objects.filter(username='newuser').exists()
        )
        
        # Sprawdzenie danych użytkownika
        uzytkownik = Uzytkownik.objects.get(username='newuser')
        self.assertEqual(uzytkownik.email, 'newuser@example.com')
        self.assertEqual(uzytkownik.first_name, 'Jan')
        self.assertEqual(uzytkownik.last_name, 'Kowalski')
    
    def test_rejestracja_niezgodne_hasla(self):
        """
        Test integracyjny: Rejestracja z niezgodnymi hasłami.
        """
        dane = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'StrongPassword123!',
            'password2': 'DifferentPassword123!',
        }
        
        response = self.client.post(self.rejestracja_url, dane, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
    
    def test_rejestracja_istniejacy_username(self):
        """
        Test integracyjny: Rejestracja z już istniejącą nazwą użytkownika.
        """
        # Utworzenie użytkownika
        Uzytkownik.objects.create_user(
            username='existinguser',
            email='existing@example.com',
            password='password123'
        )
        
        # Próba rejestracji z tym samym username
        dane = {
            'username': 'existinguser',
            'email': 'newemail@example.com',
            'password': 'StrongPassword123!',
            'password2': 'StrongPassword123!',
        }
        
        response = self.client.post(self.rejestracja_url, dane, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
    
    def test_rejestracja_slabe_haslo(self):
        """
        Test integracyjny: Rejestracja ze słabym hasłem.
        """
        dane = {
            'username': 'weakpassuser',
            'email': 'weak@example.com',
            'password': '123',
            'password2': '123',
        }
        
        response = self.client.post(self.rejestracja_url, dane, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)


class LogowanieAPITest(APITestCase):
    """
    Testy integracyjne dla endpointu logowania.
    """
    
    def setUp(self):
        """
        Przygotowanie danych testowych.
        """
        self.client = APIClient()
        self.logowanie_url = reverse('users:logowanie')
        
        # Utworzenie testowego użytkownika
        self.uzytkownik = Uzytkownik.objects.create_user(
            username='logintest',
            email='logintest@example.com',
            password='TestPassword123!'
        )
    
    def test_logowanie_poprawne_dane(self):
        """
        Test integracyjny: Logowanie z poprawnymi danymi.
        """
        dane = {
            'email': 'logintest@example.com',
            'password': 'TestPassword123!'
        }
        
        response = self.client.post(self.logowanie_url, dane, format='json')
        
        # Sprawdzenie statusu
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Sprawdzenie czy odpowiedź zawiera tokeny
        self.assertIn('tokeny', response.data)
        self.assertIn('access', response.data['tokeny'])
        self.assertIn('refresh', response.data['tokeny'])
        
        # Sprawdzenie danych użytkownika
        self.assertIn('uzytkownik', response.data)
        self.assertEqual(response.data['uzytkownik']['username'], 'logintest')
    
    def test_logowanie_niepoprawne_haslo(self):
        """
        Test integracyjny: Logowanie z niepoprawnym hasłem.
        """
        dane = {
            'email': 'logintest@example.com',
            'password': 'WrongPassword123!'
        }
        
        response = self.client.post(self.logowanie_url, dane, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)
    
    def test_logowanie_nieistniejacy_uzytkownik(self):
        """
        Test integracyjny: Logowanie nieistniejącego użytkownika.
        """
        dane = {
            'email': 'nonexistent@example.com',
            'password': 'SomePassword123!'
        }
        
        response = self.client.post(self.logowanie_url, dane, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_logowanie_brak_danych(self):
        """
        Test integracyjny: Logowanie bez podania danych.
        """
        dane = {}
        
        response = self.client.post(self.logowanie_url, dane, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PobierzUzytkownikaAPITest(APITestCase):
    """
    Testy integracyjne dla endpointu pobierania danych zalogowanego użytkownika.
    """
    
    def setUp(self):
        """
        Przygotowanie danych testowych.
        """
        self.client = APIClient()
        self.uzytkownik_url = reverse('users:aktualny_uzytkownik')
        
        # Utworzenie testowego użytkownika
        self.uzytkownik = Uzytkownik.objects.create_user(
            username='currentuser',
            email='current@example.com',
            password='TestPassword123!'
        )
    
    def test_pobierz_uzytkownika_zalogowany(self):
        """
        Test integracyjny: Pobieranie danych zalogowanego użytkownika.
        """
        # Uwierzytelnienie
        self.client.force_authenticate(user=self.uzytkownik)
        
        response = self.client.get(self.uzytkownik_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'currentuser')
        self.assertEqual(response.data['email'], 'current@example.com')
        self.assertIn('profil', response.data)
    
    def test_pobierz_uzytkownika_niezalogowany(self):
        """
        Test integracyjny: Próba pobrania danych bez zalogowania.
        """
        response = self.client.get(self.uzytkownik_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AktualizacjaProfiluAPITest(APITestCase):
    """
    Testy integracyjne dla endpointu aktualizacji profilu.
    """
    
    def setUp(self):
        """
        Przygotowanie danych testowych.
        """
        self.client = APIClient()
        self.profil_url = reverse('users:aktualizuj_profil')
        
        self.uzytkownik = Uzytkownik.objects.create_user(
            username='profileuser',
            email='profile@example.com',
            password='TestPassword123!'
        )
    
    def test_aktualizacja_profilu_zalogowany(self):
        """
        Test integracyjny: Aktualizacja profilu przez zalogowanego użytkownika.
        """
        self.client.force_authenticate(user=self.uzytkownik)
        
        dane = {
            'first_name': 'Jan',
            'last_name': 'Kowalski',
            'profil': {
                'wydzial': 'Informatyka',
                'rok_studiow': 3,
                'opis': 'Student informatyki'
            }
        }
        
        response = self.client.patch(self.profil_url, dane, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Sprawdzenie zaktualizowanych danych
        self.uzytkownik.refresh_from_db()
        self.assertEqual(self.uzytkownik.first_name, 'Jan')
        self.assertEqual(self.uzytkownik.last_name, 'Kowalski')
        self.assertEqual(self.uzytkownik.profil.wydzial, 'Informatyka')
        self.assertEqual(self.uzytkownik.profil.rok_studiow, 3)
