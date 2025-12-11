"""
Kontrolery (Views) dla aplikacji forum.
Zgodnie z zasadami Clean Code i SOLID:
- Single Responsibility: każdy kontroler odpowiada za jedną funkcjonalność
- DRY: wykorzystanie serwisów do logiki biznesowej
- KISS: proste, zrozumiałe API
"""
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied

from .models import Kategoria, Watek, Post
from .serializers import (
    KategoriaSerializer,
    WatekListSerializer,
    WatekDetailSerializer,
    PostSerializer,
    UtworzPostSerializer,
    GlosujSerializer,
    StatystykiSerializer
)
from .services import (
    KategoriaService,
    WatekService,
    PostService,
    StatystykiService
)
from .permissions import JestAdministratorem, JestAutoremLubAdmin


class ForumController:
    """
    Kontroler forum - grupuje funkcje dla zwykłych użytkowników.
    Zgodnie z zasadą Single Responsibility Principle.
    """
    
    class ListaKategorii(generics.ListAPIView):
        """Pobiera listę kategorii z liczbą wątków."""
        serializer_class = KategoriaSerializer
        permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        
        def get_queryset(self):
            return KategoriaService.pobierz_kategorie_z_liczba_watkow()
    
    
    class ListaWatkow(generics.ListAPIView):
        """
        Pobiera listę wątków z filtrowaniem.
        Query params: kategoria, szukaj
        """
        serializer_class = WatekListSerializer
        permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        
        def get_queryset(self):
            kategoria_id = self.request.query_params.get('kategoria', None)
            szukaj = self.request.query_params.get('szukaj', None)
            return WatekService.pobierz_watki_wg_kategorii(kategoria_id, szukaj)
    
    
    class UtworzWatek(generics.CreateAPIView):
        """Tworzy nowy wątek."""
        serializer_class = WatekListSerializer
        permission_classes = [permissions.IsAuthenticated]
        
        def perform_create(self, serializer):
            serializer.save(autor=self.request.user)
    
    
    class SzczegolyWatku(generics.RetrieveAPIView):
        """Pobiera szczegóły wątku z postami."""
        serializer_class = WatekDetailSerializer
        permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        
        def get_object(self):
            watek_id = self.kwargs.get('pk')
            return WatekService.pobierz_watek_ze_szczegolami(watek_id)
    
    
    class PostyWatku(generics.ListAPIView):
        """Pobiera posty wątku."""
        serializer_class = PostSerializer
        permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        
        def get_queryset(self):
            watek_id = self.kwargs.get('watek_id')
            return PostService.pobierz_posty_watku(watek_id)
    
    
    class UtworzPost(APIView):
        """Tworzy nowy post w wątku."""
        permission_classes = [permissions.IsAuthenticated]
        
        def post(self, request, watek_id):
            serializer = UtworzPostSerializer(data=request.data)
            
            if serializer.is_valid():
                try:
                    post = PostService.utworz_post(
                        autor=request.user,
                        watek_id=watek_id,
                        dane=serializer.validated_data
                    )
                    return Response(
                        PostSerializer(post, context={'request': request}).data,
                        status=status.HTTP_201_CREATED
                    )
                except PermissionDenied as e:
                    return Response(
                        {'error': str(e)},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
    class EdytujPost(APIView):
        """Edytuje post (autor lub admin)."""
        permission_classes = [permissions.IsAuthenticated]
        
        def patch(self, request, pk):
            serializer = UtworzPostSerializer(data=request.data, partial=True)
            
            if serializer.is_valid():
                try:
                    post = PostService.aktualizuj_post(
                        post_id=pk,
                        uzytkownik=request.user,
                        dane=serializer.validated_data
                    )
                    return Response(
                        PostSerializer(post, context={'request': request}).data,
                        status=status.HTTP_200_OK
                    )
                except PermissionDenied as e:
                    return Response(
                        {'error': str(e)},
                        status=status.HTTP_403_FORBIDDEN
                    )
                except Post.DoesNotExist:
                    return Response(
                        {'error': 'Post nie istnieje.'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
    class UsunPost(APIView):
        """Usuwa post (autor lub admin)."""
        permission_classes = [permissions.IsAuthenticated]
        
        def delete(self, request, pk):
            try:
                PostService.usun_post(pk, request.user)
                return Response(
                    {'wiadomosc': 'Post został usunięty.'},
                    status=status.HTTP_200_OK
                )
            except PermissionDenied as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_403_FORBIDDEN
                )
            except Post.DoesNotExist:
                return Response(
                    {'error': 'Post nie istnieje.'},
                    status=status.HTTP_404_NOT_FOUND
                )
    
    
    class GlosujNaPost(APIView):
        """Głosuje na post (+1 lub -1)."""
        permission_classes = [permissions.IsAuthenticated]
        
        def post(self, request, pk):
            serializer = GlosujSerializer(data=request.data)
            
            if serializer.is_valid():
                try:
                    glos = PostService.glosuj_na_post(
                        uzytkownik=request.user,
                        post_id=pk,
                        wartosc=serializer.validated_data['wartosc']
                    )
                    return Response(
                        {'wiadomosc': 'Głos został zapisany.', 'wartosc': glos.wartosc},
                        status=status.HTTP_200_OK
                    )
                except Post.DoesNotExist:
                    return Response(
                        {'error': 'Post nie istnieje.'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                except ValueError as e:
                    return Response(
                        {'error': str(e)},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminController:
    """
    Kontroler administratora - funkcje dostępne tylko dla adminów.
    Zgodnie z zasadą Single Responsibility Principle.
    """
    
    class ZarzadzajKategoriami(generics.ListCreateAPIView):
        """Lista i tworzenie kategorii (admin)."""
        serializer_class = KategoriaSerializer
        permission_classes = [permissions.IsAuthenticated, JestAdministratorem]
        
        def get_queryset(self):
            return KategoriaService.pobierz_kategorie_z_liczba_watkow()
        
        def perform_create(self, serializer):
            serializer.save()
    
    
    class EdytujKategorie(generics.RetrieveUpdateDestroyAPIView):
        """Edycja i usuwanie kategorii (admin)."""
        queryset = Kategoria.objects.all()
        serializer_class = KategoriaSerializer
        permission_classes = [permissions.IsAuthenticated, JestAdministratorem]
    
    
    class ZablokujWatek(APIView):
        """Blokuje lub odblokowuje wątek."""
        permission_classes = [permissions.IsAuthenticated, JestAdministratorem]
        
        def post(self, request, pk):
            akcja = request.data.get('akcja', 'zablokuj')
            
            try:
                if akcja == 'zablokuj':
                    watek = WatekService.zablokuj_watek(pk)
                    wiadomosc = 'Wątek został zablokowany.'
                elif akcja == 'odblokuj':
                    watek = WatekService.odblokuj_watek(pk)
                    wiadomosc = 'Wątek został odblokowany.'
                else:
                    return Response(
                        {'error': 'Nieprawidłowa akcja. Użyj "zablokuj" lub "odblokuj".'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                return Response(
                    {
                        'wiadomosc': wiadomosc,
                        'watek': WatekListSerializer(watek).data
                    },
                    status=status.HTTP_200_OK
                )
            except Watek.DoesNotExist:
                return Response(
                    {'error': 'Wątek nie istnieje.'},
                    status=status.HTTP_404_NOT_FOUND
                )
    
    
    class UsunWatek(APIView):
        """Usuwa wątek (admin)."""
        permission_classes = [permissions.IsAuthenticated, JestAdministratorem]
        
        def delete(self, request, pk):
            try:
                WatekService.usun_watek(pk)
                return Response(
                    {'wiadomosc': 'Wątek został usunięty.'},
                    status=status.HTTP_200_OK
                )
            except Watek.DoesNotExist:
                return Response(
                    {'error': 'Wątek nie istnieje.'},
                    status=status.HTTP_404_NOT_FOUND
                )
    
    
    class StatystykiForum(APIView):
        """Pobiera statystyki forum (admin)."""
        permission_classes = [permissions.IsAuthenticated, JestAdministratorem]
        
        def get(self, request):
            statystyki = StatystykiService.pobierz_statystyki_forum()
            serializer = StatystykiSerializer(statystyki)
            return Response(serializer.data, status=status.HTTP_200_OK)
