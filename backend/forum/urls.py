"""
URL configuration dla aplikacji forum.
Endpointy dla użytkowników i administratorów.
"""
from django.urls import path
from .views import ForumController, AdminController

app_name = 'forum'

urlpatterns = [
    # ===== Endpointy dla użytkowników =====
    
    # Kategorie (odczyt)
    path('kategorie/', ForumController.ListaKategorii.as_view(), name='lista_kategorii'),
    
    # Wątki
    path('watki/', ForumController.ListaWatkow.as_view(), name='lista_watkow'),
    path('watki/nowy/', ForumController.UtworzWatek.as_view(), name='utworz_watek'),
    path('watki/<int:pk>/', ForumController.SzczegolyWatku.as_view(), name='szczegoly_watku'),
    path('watki/<int:watek_id>/posty/', ForumController.PostyWatku.as_view(), name='posty_watku'),
    path('watki/<int:watek_id>/posty/nowy/', ForumController.UtworzPost.as_view(), name='utworz_post'),
    
    # Posty
    path('posty/<int:pk>/', ForumController.EdytujPost.as_view(), name='edytuj_post'),
    path('posty/<int:pk>/usun/', ForumController.UsunPost.as_view(), name='usun_post'),
    path('posty/<int:pk>/glosuj/', ForumController.GlosujNaPost.as_view(), name='glosuj_na_post'),
    
    # ===== Endpointy dla administratorów =====
    
    # Zarządzanie kategoriami
    path('admin/kategorie/', AdminController.ZarzadzajKategoriami.as_view(), name='admin_kategorie'),
    path('admin/kategorie/<int:pk>/', AdminController.EdytujKategorie.as_view(), name='admin_edytuj_kategorie'),
    
    # Zarządzanie wątkami
    path('admin/watki/<int:pk>/zablokuj/', AdminController.ZablokujWatek.as_view(), name='admin_zablokuj_watek'),
    path('admin/watki/<int:pk>/', AdminController.UsunWatek.as_view(), name='admin_usun_watek'),
    
    # Statystyki
    path('admin/statystyki/', AdminController.StatystykiForum.as_view(), name='admin_statystyki'),
]
