"""
Skrypt do utworzenia przykładowych użytkowników.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import Uzytkownik

# Usuń istniejące konta jeśli istnieją
Uzytkownik.objects.filter(email__in=['admin@pans.pl', 'student@pans.pl']).delete()

# Utwórz admina
admin = Uzytkownik.objects.create_user(
    username='admin',
    email='admin@pans.pl',
    password='admin123',
    first_name='Admin',
    last_name='Systemu'
)
admin.rola = 'ADMIN'
admin.is_staff = True
admin.is_superuser = True
admin.save()

# Utwórz studenta
student = Uzytkownik.objects.create_user(
    username='student',
    email='student@pans.pl',
    password='student123',
    first_name='Jan',
    last_name='Kowalski'
)
student.rola = 'USER'
student.save()

print('✅ Konta utworzone pomyślnie!')
print('\n📋 Dane logowania:')
print('\nADMIN:')
print('  Email/Username: admin / admin@pans.pl')
print('  Hasło: admin123')
print('  Rola: ADMIN')
print('\nSTUDENT:')
print('  Email/Username: student / student@pans.pl')
print('  Hasło: student123')
print('  Rola: USER')
