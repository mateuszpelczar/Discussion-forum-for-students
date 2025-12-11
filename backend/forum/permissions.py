"""
Uprawnienia (permissions) dla aplikacji forum.
Zgodnie z zasadami Single Responsibility - każda klasa odpowiada za jedno uprawnienie.
"""
from rest_framework.permissions import BasePermission


class JestAdministratorem(BasePermission):
    """
    Uprawnienie sprawdzające czy użytkownik jest administratorem.
    """
    message = "Tylko administratorzy mają dostęp do tej funkcji."
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.rola == 'ADMIN'
        )


class JestAutoremLubAdmin(BasePermission):
    """
    Uprawnienie sprawdzające czy użytkownik jest autorem obiektu lub administratorem.
    """
    message = "Musisz być autorem lub administratorem."
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin ma dostęp do wszystkiego
        if request.user.rola == 'ADMIN':
            return True
        
        # Sprawdź czy jest autorem
        if hasattr(obj, 'autor'):
            return obj.autor == request.user
        
        return False


class WatekNieZablokowany(BasePermission):
    """
    Uprawnienie sprawdzające czy wątek nie jest zablokowany.
    Administratorzy mogą pisać nawet w zablokowanych wątkach.
    """
    message = "Ten wątek jest zablokowany."
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin może zawsze
        if request.user.rola == 'ADMIN':
            return True
        
        # Dla postów - sprawdź wątek
        if hasattr(obj, 'watek'):
            return not obj.watek.zablokowany
        
        # Dla wątków - sprawdź bezpośrednio
        if hasattr(obj, 'zablokowany'):
            return not obj.zablokowany
        
        return True
