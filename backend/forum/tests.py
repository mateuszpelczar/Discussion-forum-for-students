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


# ==================== TESTY JEDNOSTKOWE ====================

class KategoriaServiceTest(TestCase):
    """
    Testy jednostkowe dla serwisu kategorii.
    """
    
    def test_utworzenie_kategorii(self):
        """Test tworzenia kategorii przez serwis."""
        kategoria = KategoriaService.utworz_kategorie({
            'nazwa': 'Programowanie',
            'opis': 'Dyskusje o programowaniu'
        })
        
        self.assertEqual(kategoria.nazwa, 'Programowanie')
        self.assertEqual(kategoria.opis, 'Dyskusje o programowaniu')
        self.assertTrue(Kategoria.objects.filter(id=kategoria.id).exists())
    
    def test_pobieranie_kategorii_z_liczba_watkow(self):
        """Test pobierania kategorii z liczbą wątków (JOIN)."""
        kategoria = Kategoria.objects.create(nazwa='Test', opis='Opis')
        
        kategorie = KategoriaService.pobierz_kategorie_z_liczba_watkow()
        
        self.assertEqual(kategorie.count(), 1)
        self.assertTrue(hasattr(kategorie.first(), 'liczba_watkow'))
    
    def test_aktualizacja_kategorii(self):
        """Test aktualizacji kategorii przez serwis."""
        kategoria = Kategoria.objects.create(nazwa='Stara nazwa', opis='Stary opis')
        
        zaktualizowana = KategoriaService.aktualizuj_kategorie(
            kategoria.id, 
            {'nazwa': 'Nowa nazwa'}
        )
        
        self.assertEqual(zaktualizowana.nazwa, 'Nowa nazwa')
    
    def test_usuwanie_kategorii(self):
        """Test usuwania kategorii przez serwis."""
        kategoria = Kategoria.objects.create(nazwa='Do usunięcia')
        kategoria_id = kategoria.id
        
        KategoriaService.usun_kategorie(kategoria_id)
        
        self.assertFalse(Kategoria.objects.filter(id=kategoria_id).exists())


class WatekServiceTest(TestCase):
    """
    Testy jednostkowe dla serwisu wątków.
    """
    
    def setUp(self):
        """Przygotowanie danych testowych."""
        self.uzytkownik = Uzytkownik.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        self.kategoria = Kategoria.objects.create(
            nazwa='Testowa',
            opis='Kategoria testowa'
        )
    
    def test_utworzenie_watku(self):
        """Test tworzenia wątku przez serwis."""
        watek = WatekService.utworz_watek(
            autor=self.uzytkownik,
            dane={
                'tytul': 'Testowy wątek',
                'tresc': 'Treść wątku testowego',
                'kategoria': self.kategoria
            }
        )
        
        self.assertEqual(watek.tytul, 'Testowy wątek')
        self.assertEqual(watek.autor, self.uzytkownik)
        self.assertFalse(watek.zablokowany)
    
    def test_blokowanie_watku(self):
        """Test blokowania wątku przez serwis."""
        watek = Watek.objects.create(
            tytul='Wątek do zablokowania',
            tresc='Treść',
            autor=self.uzytkownik,
            kategoria=self.kategoria
        )
        
        zablokowany = WatekService.zablokuj_watek(watek.id)
        
        self.assertTrue(zablokowany.zablokowany)
    
    def test_odblokowywanie_watku(self):
        """Test odblokowywania wątku przez serwis."""
        watek = Watek.objects.create(
            tytul='Wątek zablokowany',
            tresc='Treść',
            autor=self.uzytkownik,
            kategoria=self.kategoria,
            zablokowany=True
        )
        
        odblokowany = WatekService.odblokuj_watek(watek.id)
        
        self.assertFalse(odblokowany.zablokowany)
    
    def test_wyszukiwanie_watkow(self):
        """Test wyszukiwania wątków przez serwis."""
        Watek.objects.create(
            tytul='Python programowanie',
            tresc='Jak pisać w Pythonie',
            autor=self.uzytkownik,
            kategoria=self.kategoria
        )
        Watek.objects.create(
            tytul='JavaScript',
            tresc='Frontend',
            autor=self.uzytkownik,
            kategoria=self.kategoria
        )
        
        wyniki = WatekService.wyszukaj_watki('Python')
        
        self.assertEqual(wyniki.count(), 1)
        self.assertIn('Python', wyniki.first().tytul)


class PostServiceTest(TestCase):
    """
    Testy jednostkowe dla serwisu postów.
    """
    
    def setUp(self):
        """Przygotowanie danych testowych."""
        self.uzytkownik = Uzytkownik.objects.create_user(
            username='postuser',
            email='post@example.com',
            password='testpassword123'
        )
        self.kategoria = Kategoria.objects.create(nazwa='Test')
        self.watek = Watek.objects.create(
            tytul='Wątek testowy',
            tresc='Treść',
            autor=self.uzytkownik,
            kategoria=self.kategoria
        )
    
    def test_tworzenie_postu(self):
        """Test tworzenia postu przez serwis."""
        post = PostService.utworz_post(
            autor=self.uzytkownik,
            watek_id=self.watek.id,
            dane={'tresc': 'Treść posta testowego'}
        )
        
        self.assertEqual(post.tresc, 'Treść posta testowego')
        self.assertEqual(post.autor, self.uzytkownik)
        self.assertEqual(post.watek, self.watek)
    
    def test_glosowanie_na_post(self):
        """Test głosowania na post przez serwis."""
        post = Post.objects.create(
            tresc='Post do głosowania',
            autor=self.uzytkownik,
            watek=self.watek
        )
        
        glos = PostService.glosuj_na_post(
            uzytkownik=self.uzytkownik,
            post_id=post.id,
            wartosc=1
        )
        
        self.assertEqual(glos.wartosc, 1)
        self.assertEqual(glos.uzytkownik, self.uzytkownik)
    
    def test_zmiana_glosu(self):
        """Test zmiany głosu na post."""
        post = Post.objects.create(
            tresc='Post',
            autor=self.uzytkownik,
            watek=self.watek
        )
        
        # Pierwszy głos
        PostService.glosuj_na_post(self.uzytkownik, post.id, 1)
        
        # Zmiana głosu
        glos = PostService.glosuj_na_post(self.uzytkownik, post.id, -1)
        
        self.assertEqual(glos.wartosc, -1)
        self.assertEqual(Glos.objects.filter(uzytkownik=self.uzytkownik, post=post).count(), 1)


class StatystykiServiceTest(TestCase):
    """
    Testy jednostkowe dla serwisu statystyk.
    """
    
    def setUp(self):
        """Przygotowanie danych testowych."""
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
        self.kategoria = Kategoria.objects.create(nazwa='Statystyki')
    
    def test_pobieranie_statystyk(self):
        """Test pobierania statystyk forum."""
        statystyki = StatystykiService.pobierz_statystyki_forum()
        
        self.assertIn('liczba_uzytkownikow', statystyki)
        self.assertIn('liczba_adminow', statystyki)
        self.assertIn('liczba_kategorii', statystyki)
        self.assertEqual(statystyki['liczba_uzytkownikow'], 2)
        self.assertEqual(statystyki['liczba_adminow'], 1)
        self.assertEqual(statystyki['liczba_kategorii'], 1)


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
        self.assertEqual(len(response.data), 1)
    
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
