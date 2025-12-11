"""
Warstwa serwisów dla aplikacji forum.
Zgodnie z zasadami Clean Code i SOLID:
- Single Responsibility: każdy serwis odpowiada za jedną domenę
- DRY: centralizacja logiki biznesowej
- Dependency Inversion: serwisy używane przez kontrolery
"""
from django.db.models import Count, Sum, Q
from django.db import transaction
from django.core.exceptions import PermissionDenied
from .models import Kategoria, Watek, Post, Glos


class KategoriaService:
    """
    Serwis do zarządzania kategoriami forum.
    """
    
    @staticmethod
    def pobierz_wszystkie_kategorie():
        """Pobiera wszystkie kategorie."""
        return Kategoria.objects.all().order_by('nazwa')
    
    @staticmethod
    def pobierz_kategorie_z_liczba_watkow():
        """
        Pobiera kategorie z liczbą wątków (JOIN z grupowaniem).
        Spełnia wymaganie: zapytanie z JOIN-em z kilku tabel.
        """
        return Kategoria.objects.annotate(
            liczba_watkow=Count('watki'),
            liczba_postow=Count('watki__posty')
        ).order_by('nazwa')
    
    @staticmethod
    def utworz_kategorie(dane):
        """Tworzy nową kategorię."""
        return Kategoria.objects.create(**dane)
    
    @staticmethod
    def aktualizuj_kategorie(kategoria_id, dane):
        """Aktualizuje kategorię."""
        kategoria = Kategoria.objects.get(id=kategoria_id)
        for key, value in dane.items():
            setattr(kategoria, key, value)
        kategoria.save()
        return kategoria
    
    @staticmethod
    def usun_kategorie(kategoria_id):
        """Usuwa kategorię."""
        kategoria = Kategoria.objects.get(id=kategoria_id)
        kategoria.delete()


class WatekService:
    """
    Serwis do zarządzania wątkami dyskusyjnymi.
    """
    
    @staticmethod
    def pobierz_watki_wg_kategorii(kategoria_id=None, szukaj=None):
        """
        Pobiera wątki z filtrowaniem.
        Obsługuje filtrowanie po kategorii i wyszukiwanie tekstowe.
        """
        queryset = Watek.objects.select_related('autor', 'kategoria').annotate(
            liczba_postow=Count('posty')
        )
        
        if kategoria_id:
            queryset = queryset.filter(kategoria_id=kategoria_id)
        
        if szukaj:
            queryset = queryset.filter(
                Q(tytul__icontains=szukaj) | Q(tresc__icontains=szukaj)
            )
        
        return queryset.order_by('-data_utworzenia')
    
    @staticmethod
    def pobierz_watek_ze_szczegolami(watek_id):
        """
        Pobiera wątek ze szczegółami (JOIN z postami i autorami).
        Spełnia wymaganie: zapytanie z JOIN-em z kilku tabel.
        """
        return Watek.objects.select_related(
            'autor', 'autor__profil', 'kategoria'
        ).prefetch_related(
            'posty', 'posty__autor', 'posty__autor__profil', 'posty__glosy'
        ).annotate(
            liczba_postow=Count('posty')
        ).get(id=watek_id)
    
    @staticmethod
    def utworz_watek(autor, dane):
        """Tworzy nowy wątek."""
        return Watek.objects.create(autor=autor, **dane)
    
    @staticmethod
    def zablokuj_watek(watek_id):
        """Blokuje wątek (tylko admin)."""
        watek = Watek.objects.get(id=watek_id)
        watek.zablokowany = True
        watek.save()
        return watek
    
    @staticmethod
    def odblokuj_watek(watek_id):
        """Odblokowuje wątek (tylko admin)."""
        watek = Watek.objects.get(id=watek_id)
        watek.zablokowany = False
        watek.save()
        return watek
    
    @staticmethod
    def usun_watek(watek_id):
        """Usuwa wątek."""
        watek = Watek.objects.get(id=watek_id)
        watek.delete()
    
    @staticmethod
    def wyszukaj_watki(fraza):
        """Wyszukuje wątki po frazie."""
        return WatekService.pobierz_watki_wg_kategorii(szukaj=fraza)


class PostService:
    """
    Serwis do zarządzania postami w wątkach.
    """
    
    @staticmethod
    def pobierz_posty_watku(watek_id):
        """
        Pobiera posty wątku z głosami (JOIN).
        Spełnia wymaganie: zapytanie z JOIN-em z kilku tabel.
        """
        return Post.objects.filter(watek_id=watek_id).select_related(
            'autor', 'autor__profil'
        ).prefetch_related('glosy').annotate(
            suma_glosow=Sum('glosy__wartosc')
        ).order_by('data_utworzenia')
    
    @staticmethod
    def utworz_post(autor, watek_id, dane):
        """
        Tworzy nowy post w wątku.
        Sprawdza czy wątek nie jest zablokowany.
        """
        watek = Watek.objects.get(id=watek_id)
        
        if watek.zablokowany:
            raise PermissionDenied("Wątek jest zablokowany.")
        
        return Post.objects.create(autor=autor, watek=watek, **dane)
    
    @staticmethod
    def aktualizuj_post(post_id, uzytkownik, dane):
        """
        Aktualizuje post.
        Tylko autor lub admin może edytować.
        """
        post = Post.objects.select_related('watek', 'autor').get(id=post_id)
        
        if post.watek.zablokowany:
            raise PermissionDenied("Wątek jest zablokowany.")
        
        jest_admin = uzytkownik.rola == 'ADMIN'
        jest_autorem = post.autor == uzytkownik
        
        if not (jest_admin or jest_autorem):
            raise PermissionDenied("Brak uprawnień do edycji tego postu.")
        
        for key, value in dane.items():
            setattr(post, key, value)
        post.save()
        return post
    
    @staticmethod
    def usun_post(post_id, uzytkownik):
        """
        Usuwa post.
        Tylko autor lub admin może usunąć.
        """
        post = Post.objects.select_related('autor').get(id=post_id)
        
        jest_admin = uzytkownik.rola == 'ADMIN'
        jest_autorem = post.autor == uzytkownik
        
        if not (jest_admin or jest_autorem):
            raise PermissionDenied("Brak uprawnień do usunięcia tego postu.")
        
        post.delete()
    
    @staticmethod
    @transaction.atomic
    def glosuj_na_post(uzytkownik, post_id, wartosc):
        """
        Głosuje na post (+1 lub -1).
        Jeśli użytkownik już głosował, aktualizuje głos.
        """
        if wartosc not in [1, -1]:
            raise ValueError("Wartość głosu musi być 1 lub -1.")
        
        post = Post.objects.get(id=post_id)
        
        glos, utworzony = Glos.objects.update_or_create(
            uzytkownik=uzytkownik,
            post=post,
            defaults={'wartosc': wartosc}
        )
        
        return glos


class StatystykiService:
    """
    Serwis do generowania statystyk forum (dla admina).
    """
    
    @staticmethod
    def pobierz_statystyki_forum():
        """
        Pobiera statystyki forum.
        Wykorzystuje agregacje i grupowania.
        """
        from users.models import Uzytkownik
        
        return {
            'liczba_uzytkownikow': Uzytkownik.objects.count(),
            'liczba_adminow': Uzytkownik.objects.filter(rola='ADMIN').count(),
            'liczba_kategorii': Kategoria.objects.count(),
            'liczba_watkow': Watek.objects.count(),
            'liczba_watkow_zablokowanych': Watek.objects.filter(zablokowany=True).count(),
            'liczba_postow': Post.objects.count(),
            'liczba_glosow': Glos.objects.count(),
        }
    
    @staticmethod
    def pobierz_statystyki_kategorii():
        """
        Pobiera statystyki per kategoria.
        JOIN z grupowaniem.
        """
        return Kategoria.objects.annotate(
            liczba_watkow=Count('watki'),
            liczba_postow=Count('watki__posty')
        ).values('id', 'nazwa', 'liczba_watkow', 'liczba_postow')
