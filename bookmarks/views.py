from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Bookmark
from .serializers import BookmarkSerializer


class AddBookmarkView(generics.CreateAPIView):

    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )


class BookmarkListView(generics.ListAPIView):

    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Bookmark.objects.filter(
            user=self.request.user
        )


class RemoveBookmarkView(generics.DestroyAPIView):

    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Bookmark.objects.filter(
            user=self.request.user
        )


class BookmarkStatusView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, property_id):

        is_bookmarked = Bookmark.objects.filter(
            user=request.user,
            property_id=property_id
        ).exists()

        return Response(
            {"is_bookmarked": is_bookmarked},
            status=status.HTTP_200_OK
        )
