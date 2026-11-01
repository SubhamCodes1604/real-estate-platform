from rest_framework.permissions import BasePermission


def _has_role(request, *roles):
    user = request.user
    return bool(
        user and user.is_authenticated and getattr(user, "role", None) in roles
    )


class IsAdminRole(BasePermission):

    def has_permission(self, request, view):
        return _has_role(request, "ADMIN")


class IsAgentRole(BasePermission):

    def has_permission(self, request, view):
        return _has_role(request, "AGENT")


class IsBuyerRole(BasePermission):

    def has_permission(self, request, view):
        return _has_role(request, "USER")


class IsAgentOrAdmin(BasePermission):

    def has_permission(self, request, view):
        return _has_role(request, "AGENT", "ADMIN")


class IsOwnerOrAdmin(BasePermission):

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if _has_role(request, "ADMIN"):
            return True
        owner = getattr(obj, "created_by", None) or getattr(obj, "user", None)
        return owner is not None and owner == request.user
