from django.db import models
from django.conf import settings

class Kategoria(models.Model):
    nazwa = models.CharField(max_length=100, unique=True)
    opis = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Kategorie"

    def __str__(self):
        return self.nazwa

class Watek(models.Model):
    tytul = models.CharField(max_length=255)
    tresc = models.TextField()
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='watki')
    kategoria = models.ForeignKey(Kategoria, on_delete=models.CASCADE, related_name='watki')
    data_utworzenia = models.DateTimeField(auto_now_add=True)
    data_aktualizacji = models.DateTimeField(auto_now=True)
    zablokowany = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = "Wątki"

    def __str__(self):
        return self.tytul

class Post(models.Model):
    tresc = models.TextField()
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posty')
    watek = models.ForeignKey(Watek, on_delete=models.CASCADE, related_name='posty')
    data_utworzenia = models.DateTimeField(auto_now_add=True)
    data_aktualizacji = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Posty"

    def __str__(self):
        return f"Post autora {self.autor.username} w wątku {self.watek.tytul}"

class Glos(models.Model):
    WARTOSC_CHOICES = (
        (1, 'Głos na tak'),
        (-1, 'Głos na nie'),
    )
    uzytkownik = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='glosy')
    wartosc = models.IntegerField(choices=WARTOSC_CHOICES)

    class Meta:
        unique_together = ('uzytkownik', 'post')
        verbose_name_plural = "Głosy"

    def __str__(self):
        return f"{self.uzytkownik.username} zagłosował {self.wartosc} na post {self.post.id}"
