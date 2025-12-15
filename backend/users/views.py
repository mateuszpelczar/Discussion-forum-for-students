"""
Kontrolery (Views) dla aplikacji users.
Zgodnie z zasadami Clean Code i SOLID:
- Single Responsibility: każdy kontroler odpowiada za jedną funkcjonalność
- DRY: wykorzystanie wspólnych klas bazowych z DRF
- KISS: proste, zrozumiałe API
"""
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from .models import Uzytkownik
from .serializers import (
    UzytkownikSerializer,
    RejestrSerializer,
    AktualizacjaProfiluSerializer,
    ZmianaHaslaSerializer,
    AdminAktualizacjaUzytkownikaSerializer
)
from forum.permissions import JestAdministratorem


class AutoryzacjaController:
    """
    Kontroler autoryzacji - grupuje wszystkie funkcje związane z autoryzacją.
    Zgodnie z zasadą Single Responsibility Principle.
    """
    
    class Rejestracja(generics.CreateAPIView):
        queryset = Uzytkownik.objects.all()
        permission_classes = [permissions.AllowAny]
        serializer_class = RejestrSerializer

        def create(self, request, *args, **kwargs):
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            uzytkownik = serializer.save()
            
            # Generowanie tokenów JWT dla nowego użytkownika
            refresh = RefreshToken.for_user(uzytkownik)
            
            # Zwracanie danych użytkownika i tokenów
            uzytkownik_data = UzytkownikSerializer(uzytkownik).data
            
            return Response({
                'uzytkownik': uzytkownik_data,
                'tokeny': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'wiadomosc': 'Użytkownik został pomyślnie zarejestrowany.'
            }, status=status.HTTP_201_CREATED)
    
    
    class Logowanie(APIView):
        permission_classes = [permissions.AllowAny]

        def post(self, request):
            email = request.data.get('email')
            password = request.data.get('password')

            if not email or not password:
                return Response({
                    'error': 'Proszę podać email i hasło.'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Znalezienie użytkownika po email
            try:
                uzytkownik = Uzytkownik.objects.get(email=email)
            except Uzytkownik.DoesNotExist:
                return Response({
                    'error': 'Nieprawidłowe dane logowania.'
                }, status=status.HTTP_401_UNAUTHORIZED)

            # Weryfikacja hasła
            if not uzytkownik.check_password(password):
                return Response({
                    'error': 'Nieprawidłowe dane logowania.'
                }, status=status.HTTP_401_UNAUTHORIZED)

            # Sprawdzenie czy konto jest aktywne
            if not uzytkownik.is_active:
                return Response({
                    'error': 'Konto użytkownika jest nieaktywne.'
                }, status=status.HTTP_401_UNAUTHORIZED)

            # Generowanie tokenów JWT
            refresh = RefreshToken.for_user(uzytkownik)
            uzytkownik_data = UzytkownikSerializer(uzytkownik).data

            return Response({
                'uzytkownik': uzytkownik_data,
                'tokeny': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'wiadomosc': 'Logowanie zakończone pomyślnie.'
            }, status=status.HTTP_200_OK)

            if uzytkownik is None:
                return Response({
                    'error': 'Nieprawidłowe dane logowania.'
                }, status=status.HTTP_401_UNAUTHORIZED)

            if not uzytkownik.is_active:
                return Response({
                    'error': 'Konto użytkownika jest nieaktywne.'
                }, status=status.HTTP_401_UNAUTHORIZED)

            # Generowanie tokenów JWT
            refresh = RefreshToken.for_user(uzytkownik)
            uzytkownik_data = UzytkownikSerializer(uzytkownik).data

            return Response({
                'uzytkownik': uzytkownik_data,
                'tokeny': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'wiadomosc': 'Logowanie zakończone pomyślnie.'
            }, status=status.HTTP_200_OK)
    
    
    class Wylogowanie(APIView):
        permission_classes = [permissions.IsAuthenticated]

        def post(self, request):
            try:
                refresh_token = request.data.get("refresh")
                
                if not refresh_token:
                    return Response({
                        'error': 'Wymagany jest refresh token.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                token = RefreshToken(refresh_token)
                token.blacklist()  # Dodanie tokena do czarnej listy

                return Response({
                    'wiadomosc': 'Wylogowanie zakończone pomyślnie.'
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                return Response({
                    'error': 'Nieprawidłowy token.'
                }, status=status.HTTP_400_BAD_REQUEST)
    
    
    class PobierzAktualnegoUzytkownika(APIView):
        permission_classes = [permissions.IsAuthenticated]

        def get(self, request):
            serializer = UzytkownikSerializer(request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)


class ProfilController:
    """
    Kontroler profilu użytkownika.
    Odpowiada za operacje na profilu użytkownika.
    """
    
    class AktualizujProfil(generics.UpdateAPIView):
        serializer_class = AktualizacjaProfiluSerializer
        permission_classes = [permissions.IsAuthenticated]

        def get_object(self):
            return self.request.user
    
    
    class ZmienHaslo(APIView):
        permission_classes = [permissions.IsAuthenticated]

        def post(self, request):
            serializer = ZmianaHaslaSerializer(
                data=request.data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'wiadomosc': 'Hasło zostało pomyślnie zmienione.'
                }, status=status.HTTP_200_OK)
            
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )


class UzytkownikController:
    """
    Kontroler użytkowników - operacje na liście użytkowników.
    Zgodnie z wymaganiami: lista aktywnych użytkowników.
    """
    
    class ListaUzytkownikow(generics.ListAPIView):
        serializer_class = UzytkownikSerializer
        permission_classes = [permissions.IsAuthenticated]

        def get_queryset(self):
            queryset = Uzytkownik.objects.all().select_related('profil')
            
            # Filtrowanie po roli
            rola = self.request.query_params.get('rola', None)
            if rola:
                queryset = queryset.filter(rola=rola)
            
            # Wyszukiwanie po username
            search = self.request.query_params.get('search', None)
            if search:
                queryset = queryset.filter(username__icontains=search)
            
            return queryset.order_by('-date_joined')
    
    
    class SzczegolyUzytkownika(generics.RetrieveAPIView):
        queryset = Uzytkownik.objects.all().select_related('profil')
        serializer_class = UzytkownikSerializer
        permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class AdminController:
    """
    Kontroler administracyjny - operacje zarządzania użytkownikami.
    Tylko dla użytkowników z rolą ADMIN.
    """
    
    class AktualizujUzytkownika(generics.UpdateAPIView):
        """
        Aktualizacja danych użytkownika przez administratora.
        Pozwala na zmianę: username, email, first_name, last_name, rola, is_active.
        """
        queryset = Uzytkownik.objects.all().select_related('profil')
        serializer_class = AdminAktualizacjaUzytkownikaSerializer
        permission_classes = [permissions.IsAuthenticated, JestAdministratorem]
        
        def update(self, request, *args, **kwargs):
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            # Zwróć pełne dane użytkownika
            return Response({
                'wiadomosc': 'Dane użytkownika zostały zaktualizowane.',
                'uzytkownik': UzytkownikSerializer(instance).data
            }, status=status.HTTP_200_OK)
    
    
    class ZablokujUzytkownika(APIView):
        """
        Blokowanie użytkownika (ustawienie is_active=False).
        """
        permission_classes = [permissions.IsAuthenticated, JestAdministratorem]
        
        def post(self, request, pk):
            try:
                uzytkownik = Uzytkownik.objects.get(pk=pk)
            except Uzytkownik.DoesNotExist:
                return Response({
                    'error': 'Użytkownik nie został znaleziony.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Nie można zablokować samego siebie
            if uzytkownik == request.user:
                return Response({
                    'error': 'Nie możesz zablokować swojego konta.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            uzytkownik.is_active = False
            uzytkownik.save()
            
            return Response({
                'wiadomosc': f'Użytkownik {uzytkownik.username} został zablokowany.',
                'uzytkownik': UzytkownikSerializer(uzytkownik).data
            }, status=status.HTTP_200_OK)
    
    
    class OdblokujUzytkownika(APIView):
        """
        Odblokowywanie użytkownika (ustawienie is_active=True).
        """
        permission_classes = [permissions.IsAuthenticated, JestAdministratorem]
        
        def post(self, request, pk):
            try:
                uzytkownik = Uzytkownik.objects.get(pk=pk)
            except Uzytkownik.DoesNotExist:
                return Response({
                    'error': 'Użytkownik nie został znaleziony.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            uzytkownik.is_active = True
            uzytkownik.save()
            
            return Response({
                'wiadomosc': f'Użytkownik {uzytkownik.username} został odblokowany.',
                'uzytkownik': UzytkownikSerializer(uzytkownik).data
            }, status=status.HTTP_200_OK)
