from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class Uzytkownik(AbstractUser):
    class Rola(models.TextChoices):
        UZYTKOWNIK = 'USER', 'Użytkownik'
        ADMINISTRATOR = 'ADMIN', 'Administrator'

    rola = models.CharField(max_length=10, choices=Rola.choices, default=Rola.UZYTKOWNIK)

    def __str__(self):
        return self.username

class Profil(models.Model):
    uzytkownik = models.OneToOneField(Uzytkownik, on_delete=models.CASCADE, related_name='profil')
    avatar = models.URLField(blank=True, null=True)
    wydzial = models.CharField(max_length=100, blank=True)
    rok_studiow = models.IntegerField(null=True, blank=True)
    opis = models.TextField(blank=True)

    def __str__(self):
        return f"Profil użytkownika {self.uzytkownik.username}"

@receiver(post_save, sender=Uzytkownik)
def utworz_profil_uzytkownika(sender, instance, created, **kwargs):
    if created:
        Profil.objects.create(uzytkownik=instance)

@receiver(post_save, sender=Uzytkownik)
def zapisz_profil_uzytkownika(sender, instance, **kwargs):
    instance.profil.save()
