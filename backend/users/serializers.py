"""
Serializery dla aplikacji users.
Zgodnie z zasadami DRY i Single Responsibility Principle.
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import Uzytkownik, Profil


class ProfilSerializer(serializers.ModelSerializer):
    """
    Serializer dla modelu Profil.
    Odpowiada za serializację danych profilu użytkownika.
    """
    class Meta:
        model = Profil
        fields = ['avatar', 'wydzial', 'rok_studiow', 'opis']
        extra_kwargs = {
            'avatar': {'required': False},
            'wydzial': {'required': False},
            'rok_studiow': {'required': False},
            'opis': {'required': False},
        }


class UzytkownikSerializer(serializers.ModelSerializer):
    """
    Serializer dla modelu Uzytkownik.
    Używany do zwracania danych użytkownika (bez hasła).
    """
    profil = ProfilSerializer(read_only=True)
    
    class Meta:
        model = Uzytkownik
        fields = [
            'id', 
            'username', 
            'email', 
            'first_name', 
            'last_name',
            'rola', 
            'date_joined',
            'profil'
        ]
        read_only_fields = ['id', 'date_joined']


class RejestrSerializer(serializers.ModelSerializer):
    """
    Serializer dla rejestracji nowego użytkownika.
    Waliduje dane i tworzy nowego użytkownika z hashowanym hasłem.
    Zgodny z zasadą Single Responsibility - odpowiada tylko za rejestrację.
    """
    password = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'},
        help_text='Hasło musi mieć minimum 8 znaków'
    )
    password2 = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'},
        help_text='Powtórz hasło'
    )
    email = serializers.EmailField(required=True)

    class Meta:
        model = Uzytkownik
        fields = [
            'username', 
            'email', 
            'password', 
            'password2',
            'first_name',
            'last_name'
        ]
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def validate_email(self, value):
        """
        Walidacja unikalności email.
        """
        if Uzytkownik.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Użytkownik z tym adresem email już istnieje."
            )
        return value

    def validate_username(self, value):
        """
        Walidacja unikalności nazwy użytkownika.
        """
        if Uzytkownik.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "Użytkownik z tą nazwą już istnieje."
            )
        return value

    def validate(self, attrs):
        """
        Walidacja zgodności haseł i siły hasła.
        """
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Hasła nie są zgodne."
            })
        
        # Walidacja siły hasła przy użyciu walidatorów Django
        try:
            validate_password(attrs['password'])
        except ValidationError as e:
            raise serializers.ValidationError({
                "password": list(e.messages)
            })
        
        return attrs

    def create(self, validated_data):
        """
        Tworzenie nowego użytkownika z hashowanym hasłem.
        Profil jest tworzony automatycznie przez sygnał w models.py.
        """
        validated_data.pop('password2')
        
        uzytkownik = Uzytkownik.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        
        return uzytkownik


class AktualizacjaProfiluSerializer(serializers.ModelSerializer):
    """
    Serializer do aktualizacji profilu użytkownika.
    Umożliwia edycję danych profilu przez zalogowanego użytkownika.
    """
    profil = ProfilSerializer()

    class Meta:
        model = Uzytkownik
        fields = ['first_name', 'last_name', 'email', 'profil']

    def update(self, instance, validated_data):
        """
        Aktualizacja danych użytkownika i jego profilu.
        """
        profil_data = validated_data.pop('profil', None)
        
        # Aktualizacja danych użytkownika
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.save()
        
        # Aktualizacja profilu
        if profil_data:
            profil = instance.profil
            profil.avatar = profil_data.get('avatar', profil.avatar)
            profil.wydzial = profil_data.get('wydzial', profil.wydzial)
            profil.rok_studiow = profil_data.get('rok_studiow', profil.rok_studiow)
            profil.opis = profil_data.get('opis', profil.opis)
            profil.save()
        
        return instance


class ZmianaHaslaSerializer(serializers.Serializer):
    """
    Serializer do zmiany hasła przez zalogowanego użytkownika.
    """
    stare_haslo = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    nowe_haslo = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    potwierdz_haslo = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate_stare_haslo(self, value):
        """
        Sprawdzenie poprawności starego hasła.
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Nieprawidłowe stare hasło.")
        return value

    def validate(self, attrs):
        """
        Walidacja zgodności nowych haseł.
        """
        if attrs['nowe_haslo'] != attrs['potwierdz_haslo']:
            raise serializers.ValidationError({
                "nowe_haslo": "Nowe hasła nie są zgodne."
            })
        
        # Walidacja siły hasła
        try:
            validate_password(attrs['nowe_haslo'])
        except ValidationError as e:
            raise serializers.ValidationError({
                "nowe_haslo": list(e.messages)
            })
        
        return attrs

    def save(self):
        """
        Zmiana hasła użytkownika.
        """
        user = self.context['request'].user
        user.set_password(self.validated_data['nowe_haslo'])
        user.save()
        return user
