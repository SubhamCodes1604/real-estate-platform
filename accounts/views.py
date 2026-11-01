from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status as http_status

from .models import User
from .permissions import IsAdminRole
from .serializers import RegisterSerializer, UserProfileSerializer, AdminUserSerializer


class RegisterView(generics.CreateAPIView):

    queryset = User.objects.all()

    serializer_class = RegisterSerializer


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)


class AdminUserListView(generics.ListAPIView):
    """List all users with search and role filtering. Admin only."""

    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        queryset = User.objects.all().order_by("-date_joined")

        search = self.request.query_params.get("search", "")
        if search:
            queryset = queryset.filter(
                username__icontains=search
            ) | queryset.filter(
                email__icontains=search
            )

        role = self.request.query_params.get("role", "")
        if role:
            queryset = queryset.filter(role=role)

        return queryset.distinct()


class AdminUserDetailView(generics.RetrieveAPIView):
    """Retrieve individual user details. Admin only."""

    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminRole]
    queryset = User.objects.all()


class AdminUserStatusView(APIView):
    """Activate or deactivate a user account. Admin only."""

    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=http_status.HTTP_404_NOT_FOUND,
            )

        if user.pk == request.user.pk:
            return Response(
                {"detail": "You cannot change your own account status."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        new_status = request.data.get("is_active")
        if new_status is None:
            return Response(
                {"detail": "is_active field is required."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = bool(new_status)
        user.save(update_fields=["is_active"])

        serializer = AdminUserSerializer(user)
        return Response(serializer.data)
