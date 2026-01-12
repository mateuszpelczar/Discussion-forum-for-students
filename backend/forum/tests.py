"""
Testy dla aplikacji forum.
Testy jednostkowe i integracyjne dla forum dyskusyjnego.

Zgodnie z wymaganiami projektu:
- Testy jednostkowe dla serwisów
- Testy integracyjne dla API endpoints

Zgodnie z zasadami Clean Code:
- Każdy test testuje jedną funkcjonalność (Single Responsibility)
- Nazwy testów jasno opisują co testują
- Testy są niezależne od siebie
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from users.models import Uzytkownik
from .models import Kategoria, Watek, Post, Glos
from .services import KategoriaService, WatekService, PostService, StatystykiService


# ==================== TESTY JEDNOSTKOWE (z użyciem Mock) ====================

from unittest.mock import Mock, patch, MagicMock


class KategoriaServiceTest(TestCase):
    """
    Testy jednostkowe dla serwisu kategorii.
    Używa Mock do izolacji od bazy danych.
    """
    
    @patch('forum.services.Kategoria.objects')
    def test_utworzenie_kategorii(self, mock_objects):
        """Test tworzenia kategorii przez serwis."""
        # Arrange - przygotowanie mocka
        mock_kategoria = Mock()
        mock_kategoria.nazwa = 'Programowanie'
        mock_kategoria.opis = 'Dyskusje o programowaniu'
        mock_objects.create.return_value = mock_kategoria
        
        # Act - wykonanie testowanej metody
        wynik = KategoriaService.utworz_kategorie({
            'nazwa': 'Programowanie',
            'opis': 'Dyskusje o programowaniu'
        })
        
        # Assert - sprawdzenie wyników
        mock_objects.create.assert_called_once_with(
            nazwa='Programowanie',
            opis='Dyskusje o programowaniu'
        )
        self.assertEqual(wynik.nazwa, 'Programowanie')
        self.assertEqual(wynik.opis, 'Dyskusje o programowaniu')
    
    @patch('forum.services.Kategoria.objects')
    def test_pobieranie_kategorii_z_liczba_watkow(self, mock_objects):
        """Test pobierania kategorii z liczbą wątków (JOIN)."""
        # Arrange
        mock_queryset = MagicMock()
        mock_kategoria = Mock(nazwa='Test', opis='Opis', liczba_watkow=5)
        mock_queryset.order_by.return_value = [mock_kategoria]
        mock_objects.annotate.return_value = mock_queryset
        
        # Act
        kategorie = KategoriaService.pobierz_kategorie_z_liczba_watkow()
        
        # Assert
        mock_objects.annotate.assert_called_once()
        self.assertEqual(len(list(kategorie)), 1)
    
    @patch('forum.services.Kategoria.objects')
    def test_aktualizacja_kategorii(self, mock_objects):
        """Test aktualizacji kategorii przez serwis."""
        # Arrange
        mock_kategoria = Mock()
        mock_kategoria.nazwa = 'Stara nazwa'
        mock_objects.get.return_value = mock_kategoria
        
        # Act
        wynik = KategoriaService.aktualizuj_kategorie(1, {'nazwa': 'Nowa nazwa'})
        
        # Assert
        mock_objects.get.assert_called_once_with(id=1)
        mock_kategoria.save.assert_called_once()
        self.assertEqual(mock_kategoria.nazwa, 'Nowa nazwa')
    
    @patch('forum.services.Kategoria.objects')
    def test_usuwanie_kategorii(self, mock_objects):
        """Test usuwania kategorii przez serwis."""
        # Arrange
        mock_kategoria = Mock()
        mock_objects.get.return_value = mock_kategoria
        
        # Act
        KategoriaService.usun_kategorie(1)
        
        # Assert
        mock_objects.get.assert_called_once_with(id=1)
        mock_kategoria.delete.assert_called_once()


class WatekServiceTest(TestCase):
    """
    Testy jednostkowe dla serwisu wątków.
    Używa Mock do izolacji od bazy danych.
    """
    
    @patch('forum.services.Watek.objects')
    def test_utworzenie_watku(self, mock_objects):
        """Test tworzenia wątku przez serwis."""
        # Arrange
        mock_autor = Mock()
        mock_kategoria = Mock()
        mock_watek = Mock()
        mock_watek.tytul = 'Testowy wątek'
        mock_watek.autor = mock_autor
        mock_watek.zablokowany = False
        mock_objects.create.return_value = mock_watek
        
        # Act
        watek = WatekService.utworz_watek(
            autor=mock_autor,
            dane={
                'tytul': 'Testowy wątek',
                'tresc': 'Treść wątku testowego',
                'kategoria': mock_kategoria
            }
        )
        
        # Assert
        mock_objects.create.assert_called_once()
        self.assertEqual(watek.tytul, 'Testowy wątek')
        self.assertEqual(watek.autor, mock_autor)
        self.assertFalse(watek.zablokowany)
    
    @patch('forum.services.Watek.objects')
    def test_blokowanie_watku(self, mock_objects):
        """Test blokowania wątku przez serwis."""
        # Arrange
        mock_watek = Mock()
        mock_watek.zablokowany = False
        mock_objects.get.return_value = mock_watek
        
        # Act
        wynik = WatekService.zablokuj_watek(1)
        
        # Assert
        mock_objects.get.assert_called_once_with(id=1)
        self.assertTrue(mock_watek.zablokowany)
        mock_watek.save.assert_called_once()
    
    @patch('forum.services.Watek.objects')
    def test_odblokowywanie_watku(self, mock_objects):
        """Test odblokowywania wątku przez serwis."""
        # Arrange
        mock_watek = Mock()
        mock_watek.zablokowany = True
        mock_objects.get.return_value = mock_watek
        
        # Act
        wynik = WatekService.odblokuj_watek(1)
        
        # Assert
        mock_objects.get.assert_called_once_with(id=1)
        self.assertFalse(mock_watek.zablokowany)
        mock_watek.save.assert_called_once()
    
    @patch('forum.services.WatekService.pobierz_watki_wg_kategorii')
    def test_wyszukiwanie_watkow(self, mock_pobierz):
        """Test wyszukiwania wątków przez serwis."""
        # Arrange
        mock_watek = Mock(tytul='Python programowanie')
        mock_pobierz.return_value = MagicMock()
        mock_pobierz.return_value.count.return_value = 1
        mock_pobierz.return_value.first.return_value = mock_watek
        mock_pobierz.return_value.__iter__ = lambda self: iter([mock_watek])
        
        # Act
        wyniki = WatekService.wyszukaj_watki('Python')
        
        # Assert
        mock_pobierz.assert_called_once_with(szukaj='Python')


class PostServiceTest(TestCase):
    """
    Testy jednostkowe dla serwisu postów.
    Używa Mock do izolacji od bazy danych.
    """
    
    @patch('forum.services.Post.objects')
    @patch('forum.services.Watek.objects')
    def test_tworzenie_postu(self, mock_watek_objects, mock_post_objects):
        """Test tworzenia postu przez serwis."""
        # Arrange
        mock_autor = Mock()
        mock_watek = Mock()
        mock_watek.zablokowany = False
        mock_watek_objects.get.return_value = mock_watek
        
        mock_post = Mock()
        mock_post.tresc = 'Treść posta testowego'
        mock_post.autor = mock_autor
        mock_post.watek = mock_watek
        mock_post_objects.create.return_value = mock_post
        
        # Act
        post = PostService.utworz_post(
            autor=mock_autor,
            watek_id=1,
            dane={'tresc': 'Treść posta testowego'}
        )
        
        # Assert
        mock_watek_objects.get.assert_called_once_with(id=1)
        mock_post_objects.create.assert_called_once()
        self.assertEqual(post.tresc, 'Treść posta testowego')
        self.assertEqual(post.autor, mock_autor)
    
    @patch('forum.services.Watek.objects')
    def test_tworzenie_postu_w_zablokowanym_watku(self, mock_watek_objects):
        """Test że nie można dodać postu do zablokowanego wątku."""
        # Arrange
        mock_watek = Mock()
        mock_watek.zablokowany = True
        mock_watek_objects.get.return_value = mock_watek
        
        # Act & Assert
        with self.assertRaises(PermissionDenied):
            PostService.utworz_post(
                autor=Mock(),
                watek_id=1,
                dane={'tresc': 'Test'}
            )
    
    @patch('forum.services.Glos.objects')
    @patch('forum.services.Post.objects')
    def test_glosowanie_na_post(self, mock_post_objects, mock_glos_objects):
        """Test głosowania na post przez serwis."""
        # Arrange
        mock_uzytkownik = Mock()
        mock_post = Mock()
        mock_post_objects.get.return_value = mock_post
        
        mock_glos = Mock()
        mock_glos.wartosc = 1
        mock_glos.uzytkownik = mock_uzytkownik
        mock_glos_objects.update_or_create.return_value = (mock_glos, True)
        
        # Act
        glos = PostService.glosuj_na_post(
            uzytkownik=mock_uzytkownik,
            post_id=1,
            wartosc=1
        )
        
        # Assert
        mock_post_objects.get.assert_called_once_with(id=1)
        mock_glos_objects.update_or_create.assert_called_once()
        self.assertEqual(glos.wartosc, 1)
        self.assertEqual(glos.uzytkownik, mock_uzytkownik)
    
    @patch('forum.services.Glos.objects')
    @patch('forum.services.Post.objects')
    def test_zmiana_glosu(self, mock_post_objects, mock_glos_objects):
        """Test zmiany głosu na post."""
        # Arrange
        mock_uzytkownik = Mock()
        mock_post = Mock()
        mock_post_objects.get.return_value = mock_post
        
        mock_glos = Mock()
        mock_glos.wartosc = -1
        mock_glos_objects.update_or_create.return_value = (mock_glos, False)  # False = zaktualizowany
        
        # Act
        glos = PostService.glosuj_na_post(mock_uzytkownik, 1, -1)
        
        # Assert
        self.assertEqual(glos.wartosc, -1)
    
    def test_glosowanie_z_nieprawidlowa_wartoscia(self):
        """Test że głosowanie z nieprawidłową wartością rzuca wyjątek."""
        # Act & Assert
        with self.assertRaises(ValueError):
            PostService.glosuj_na_post(Mock(), 1, 5)  # 5 jest nieprawidłowe


class StatystykiServiceTest(TestCase):
    """
    Testy jednostkowe dla serwisu statystyk.
    Używa Mock do izolacji od bazy danych.
    """
    
    @patch('forum.services.Glos.objects')
    @patch('forum.services.Post.objects')
    @patch('forum.services.Watek.objects')
    @patch('forum.services.Kategoria.objects')
    @patch('users.models.Uzytkownik.objects')
    def test_pobieranie_statystyk(self, mock_uzytkownik, mock_kategoria, 
                                   mock_watek, mock_post, mock_glos):
        """Test pobierania statystyk forum."""
        # Arrange
        mock_uzytkownik.count.return_value = 10
        mock_uzytkownik.filter.return_value.count.return_value = 2
        mock_kategoria.count.return_value = 5
        mock_watek.count.return_value = 50
        mock_watek.filter.return_value.count.return_value = 3
        mock_post.count.return_value = 200
        mock_glos.count.return_value = 500
        
        # Act
        statystyki = StatystykiService.pobierz_statystyki_forum()
        
        # Assert
        self.assertIn('liczba_uzytkownikow', statystyki)
        self.assertIn('liczba_adminow', statystyki)
        self.assertIn('liczba_kategorii', statystyki)
        self.assertEqual(statystyki['liczba_uzytkownikow'], 10)
        self.assertEqual(statystyki['liczba_adminow'], 2)
        self.assertEqual(statystyki['liczba_kategorii'], 5)
        self.assertEqual(statystyki['liczba_watkow'], 50)
        self.assertEqual(statystyki['liczba_postow'], 200)
        self.assertEqual(statystyki['liczba_glosow'], 500)
    
    @patch('forum.services.Kategoria.objects')
    def test_pobieranie_statystyk_kategorii(self, mock_kategoria_objects):
        """Test pobierania statystyk per kategoria."""
        # Arrange
        mock_queryset = MagicMock()
        mock_kategoria_stats = [
            {'id': 1, 'nazwa': 'Python', 'liczba_watkow': 10, 'liczba_postow': 50},
            {'id': 2, 'nazwa': 'JavaScript', 'liczba_watkow': 5, 'liczba_postow': 25}
        ]
        mock_queryset.values.return_value = mock_kategoria_stats
        mock_kategoria_objects.annotate.return_value = mock_queryset
        
        # Act
        statystyki = StatystykiService.pobierz_statystyki_kategorii()
        
        # Assert
        mock_kategoria_objects.annotate.assert_called_once()
        self.assertEqual(len(list(statystyki)), 2)


# ==================== TESTY INTEGRACYJNE ====================

class KategoriaAPITest(APITestCase):
    """
    Testy integracyjne dla API kategorii.
    """
    
    def setUp(self):
        """Przygotowanie danych testowych."""
        self.client = APIClient()
        self.admin = Uzytkownik.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpassword123',
            rola='ADMIN'
        )
        self.user = Uzytkownik.objects.create_user(
            username='user',
            email='user@example.com',
            password='userpassword123'
        )
        self.kategoria = Kategoria.objects.create(
            nazwa='Programowanie',
            opis='Dyskusje o programowaniu'
        )
    
    def test_lista_kategorii_publiczna(self):
        """Test pobierania listy kategorii bez logowania."""
        response = self.client.get(reverse('forum:lista_kategorii'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)  # Co najmniej 1 kategoria
    
    def test_tworzenie_kategorii_jako_admin(self):
        """Test tworzenia kategorii przez admina."""
        self.client.force_authenticate(user=self.admin)
        
        dane = {'nazwa': 'Nowa kategoria', 'opis': 'Opis nowej kategorii'}
        response = self.client.post(reverse('forum:admin_kategorie'), dane, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Kategoria.objects.count(), 2)
    
    def test_tworzenie_kategorii_jako_user_zabronione(self):
        """Test że zwykły użytkownik nie może tworzyć kategorii."""
        self.client.force_authenticate(user=self.user)
        
        dane = {'nazwa': 'Niedozwolona', 'opis': 'Opis'}
        response = self.client.post(reverse('forum:admin_kategorie'), dane, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class WatekAPITest(APITestCase):
    """
    Testy integracyjne dla API wątków.
    """
    
    def setUp(self):
        """Przygotowanie danych testowych."""
        self.client = APIClient()
        self.user = Uzytkownik.objects.create_user(
            username='watekuser',
            email='watek@example.com',
            password='testpassword123'
        )
        self.admin = Uzytkownik.objects.create_user(
            username='watekadmin',
            email='watekadmin@example.com',
            password='adminpassword123',
            rola='ADMIN'
        )
        self.kategoria = Kategoria.objects.create(nazwa='API Test')
        self.watek = Watek.objects.create(
            tytul='Testowy wątek',
            tresc='Treść testowa',
            autor=self.user,
            kategoria=self.kategoria
        )
    
    def test_lista_watkow(self):
        """Test pobierania listy wątków."""
        response = self.client.get(reverse('forum:lista_watkow'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_tworzenie_watku_zalogowany(self):
        """Test tworzenia wątku przez zalogowanego użytkownika."""
        self.client.force_authenticate(user=self.user)
        
        dane = {
            'tytul': 'Nowy wątek',
            'tresc': 'Treść nowego wątku',
            'kategoria_id': self.kategoria.id
        }
        response = self.client.post(reverse('forum:utworz_watek'), dane, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_tworzenie_watku_niezalogowany(self):
        """Test że niezalogowany użytkownik nie może tworzyć wątków."""
        dane = {
            'tytul': 'Wątek',
            'tresc': 'Treść',
            'kategoria_id': self.kategoria.id
        }
        response = self.client.post(reverse('forum:utworz_watek'), dane, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_blokowanie_watku_przez_admina(self):
        """Test blokowania wątku przez admina."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.post(
            reverse('forum:admin_zablokuj_watek', kwargs={'pk': self.watek.id}),
            {'akcja': 'zablokuj'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.watek.refresh_from_db()
        self.assertTrue(self.watek.zablokowany)
    
    def test_blokowanie_watku_przez_usera_zabronione(self):
        """Test że zwykły użytkownik nie może blokować wątków."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post(
            reverse('forum:admin_zablokuj_watek', kwargs={'pk': self.watek.id}),
            {'akcja': 'zablokuj'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class PostAPITest(APITestCase):
    """
    Testy integracyjne dla API postów.
    """
    
    def setUp(self):
        """Przygotowanie danych testowych."""
        self.client = APIClient()
        self.user = Uzytkownik.objects.create_user(
            username='postuser',
            email='post@example.com',
            password='testpassword123'
        )
        self.user2 = Uzytkownik.objects.create_user(
            username='postuser2',
            email='post2@example.com',
            password='testpassword123'
        )
        self.kategoria = Kategoria.objects.create(nazwa='Posty Test')
        self.watek = Watek.objects.create(
            tytul='Wątek do postów',
            tresc='Treść',
            autor=self.user,
            kategoria=self.kategoria
        )
        self.post = Post.objects.create(
            tresc='Post testowy',
            autor=self.user,
            watek=self.watek
        )
    
    def test_tworzenie_postu(self):
        """Test tworzenia postu w wątku."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post(
            reverse('forum:utworz_post', kwargs={'watek_id': self.watek.id}),
            {'tresc': 'Nowy post'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_glosowanie_na_post(self):
        """Test głosowania na post."""
        self.client.force_authenticate(user=self.user2)
        
        response = self.client.post(
            reverse('forum:glosuj_na_post', kwargs={'pk': self.post.id}),
            {'wartosc': 1},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['wartosc'], 1)
    
    def test_usuwanie_wlasnego_postu(self):
        """Test usuwania własnego postu."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.delete(
            reverse('forum:usun_post', kwargs={'pk': self.post.id})
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Post.objects.filter(id=self.post.id).exists())
    
    def test_usuwanie_cudzego_postu_zabronione(self):
        """Test że użytkownik nie może usunąć cudzego postu."""
        self.client.force_authenticate(user=self.user2)
        
        response = self.client.delete(
            reverse('forum:usun_post', kwargs={'pk': self.post.id})
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class StatystykiAPITest(APITestCase):
    """
    Testy integracyjne dla API statystyk.
    """
    
    def setUp(self):
        """Przygotowanie danych testowych."""
        self.client = APIClient()
        self.admin = Uzytkownik.objects.create_user(
            username='statsadmin',
            email='stats@example.com',
            password='adminpassword123',
            rola='ADMIN'
        )
        self.user = Uzytkownik.objects.create_user(
            username='statsuser',
            email='statsuser@example.com',
            password='userpassword123'
        )
    
    def test_statystyki_dla_admina(self):
        """Test pobierania statystyk przez admina."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get(reverse('forum:admin_statystyki'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('liczba_uzytkownikow', response.data)
    
    def test_statystyki_dla_usera_zabronione(self):
        """Test że zwykły użytkownik nie ma dostępu do statystyk."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(reverse('forum:admin_statystyki'))
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
