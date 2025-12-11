"""
URLe dla aplikacji users.
Zgodnie z konwencją RESTful API.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import AutoryzacjaController, ProfilController, UzytkownikController

app_name = 'users'

urlpatterns = [
    # Autoryzacja
    path('auth/rejestracja/', 
         AutoryzacjaController.Rejestracja.as_view(), 
         name='rejestracja'),
    
    path('auth/logowanie/', 
         AutoryzacjaController.Logowanie.as_view(), 
         name='logowanie'),
    
    path('auth/wylogowanie/', 
         AutoryzacjaController.Wylogowanie.as_view(), 
         name='wylogowanie'),
    
    path('auth/token/odswiez/', 
         TokenRefreshView.as_view(), 
         name='token_odswiez'),
    
    path('auth/uzytkownik/', 
         AutoryzacjaController.PobierzAktualnegoUzytkownika.as_view(), 
         name='aktualny_uzytkownik'),
    
    # Profil
    path('auth/profil/', 
         ProfilController.AktualizujProfil.as_view(), 
         name='aktualizuj_profil'),
    
    path('auth/zmien-haslo/', 
         ProfilController.ZmienHaslo.as_view(), 
         name='zmien_haslo'),
    
    # Użytkownicy
    path('uzytkownicy/', 
         UzytkownikController.ListaUzytkownikow.as_view(), 
         name='lista_uzytkownikow'),
    
    path('uzytkownicy/<int:pk>/', 
         UzytkownikController.SzczegolyUzytkownika.as_view(), 
         name='szczegoly_uzytkownika'),
]
