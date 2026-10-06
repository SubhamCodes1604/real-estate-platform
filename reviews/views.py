from django.shortcuts import render

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Review
from .serializers import ReviewSerializer
from django.db.models import Avg
from rest_framework.views import APIView
from rest_framework.response import Response


class AddReviewView(generics.CreateAPIView):

    serializer_class = ReviewSerializer

    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )


class PropertyReviewListView(generics.ListAPIView):

    serializer_class = ReviewSerializer

    def get_queryset(self):

        property_id = self.kwargs["property_id"]

        return Review.objects.filter(
            property_id=property_id
        )


class PropertyAverageRatingView(APIView):

    def get(self, request, property_id):

        avg_rating = Review.objects.filter(
            property_id=property_id
        ).aggregate(
            average=Avg("rating")
        )

        return Response(avg_rating)

class RecentReviewListView(generics.ListAPIView):

    serializer_class = ReviewSerializer

    def get_queryset(self):

        return Review.objects.all().order_by(
            "-created_at"
        )