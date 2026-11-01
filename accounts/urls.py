from django.urls import path
from .views import (
    ProfileView,
    RegisterView,
    AdminUserListView,
    AdminUserDetailView,
    AdminUserStatusView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),

    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),

    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('profile/', ProfileView.as_view(), name='profile'),

    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),

    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),

    path('admin/users/<int:pk>/status/', AdminUserStatusView.as_view(), name='admin-user-status'),
]