from django.shortcuts import render

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

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