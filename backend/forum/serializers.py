"""
Serializery dla aplikacji forum.
Zgodnie z zasadami Clean Code i SOLID:
- Single Responsibility: każdy serializer dla jednego celu
- Interface Segregation: osobne serializery dla różnych operacji
"""
from rest_framework import serializers
from .models import Kategoria, Watek, Post, Glos
from users.serializers import UzytkownikSerializer


class KategoriaSerializer(serializers.ModelSerializer):
    """Serializer dla kategorii."""
    liczba_watkow = serializers.IntegerField(read_only=True, required=False)
    liczba_postow = serializers.IntegerField(read_only=True, required=False)
    
    class Meta:
        model = Kategoria
        fields = ['id', 'nazwa', 'opis', 'liczba_watkow', 'liczba_postow']


class GlosSerializer(serializers.ModelSerializer):
    """Serializer dla głosów."""
    
    class Meta:
        model = Glos
        fields = ['id', 'wartosc']


class PostSerializer(serializers.ModelSerializer):
    """Serializer dla postów."""
    autor = UzytkownikSerializer(read_only=True)
    suma_glosow = serializers.IntegerField(read_only=True, required=False)
    moj_glos = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'tresc', 'autor', 'data_utworzenia', 
            'data_aktualizacji', 'suma_glosow', 'moj_glos'
        ]
        read_only_fields = ['autor', 'data_utworzenia', 'data_aktualizacji']
    
    def get_moj_glos(self, obj):
        """Pobiera głos aktualnego użytkownika na ten post."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                glos = Glos.objects.get(uzytkownik=request.user, post=obj)
                return glos.wartosc
            except Glos.DoesNotExist:
                return None
        return None


class UtworzPostSerializer(serializers.ModelSerializer):
    """Serializer do tworzenia postów."""
    
    class Meta:
        model = Post
        fields = ['id', 'tresc']


class WatekListSerializer(serializers.ModelSerializer):
    """Serializer dla listy wątków (bez postów)."""
    autor = UzytkownikSerializer(read_only=True)
    kategoria = KategoriaSerializer(read_only=True)
    kategoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Kategoria.objects.all(),
        source='kategoria',
        write_only=True
    )
    liczba_postow = serializers.IntegerField(read_only=True, required=False)
    
    class Meta:
        model = Watek
        fields = [
            'id', 'tytul', 'tresc', 'autor', 'kategoria', 'kategoria_id',
            'data_utworzenia', 'data_aktualizacji', 'zablokowany', 'liczba_postow'
        ]
        read_only_fields = ['autor', 'data_utworzenia', 'data_aktualizacji', 'zablokowany']


class WatekDetailSerializer(serializers.ModelSerializer):
    """Serializer dla szczegółów wątku (z postami)."""
    autor = UzytkownikSerializer(read_only=True)
    kategoria = KategoriaSerializer(read_only=True)
    posty = PostSerializer(many=True, read_only=True)
    liczba_postow = serializers.IntegerField(read_only=True, required=False)
    
    class Meta:
        model = Watek
        fields = [
            'id', 'tytul', 'tresc', 'autor', 'kategoria',
            'data_utworzenia', 'data_aktualizacji', 'zablokowany',
            'liczba_postow', 'posty'
        ]


class GlosujSerializer(serializers.Serializer):
    """Serializer do głosowania na post."""
    wartosc = serializers.ChoiceField(choices=[1, -1])


class StatystykiSerializer(serializers.Serializer):
    """Serializer dla statystyk forum."""
    liczba_uzytkownikow = serializers.IntegerField()
    liczba_adminow = serializers.IntegerField()
    liczba_kategorii = serializers.IntegerField()
    liczba_watkow = serializers.IntegerField()
    liczba_watkow_zablokowanych = serializers.IntegerField()
    liczba_postow = serializers.IntegerField()
    liczba_glosow = serializers.IntegerField()
