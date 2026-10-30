from django.db.models import Avg, Count
from django.http import Http404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from properties.models import Property
from .models import Review
from .serializers import ReviewSerializer, ReviewWriteSerializer


def require_approved_property(property_id):

    if not Property.objects.filter(
        pk=property_id,
        is_approved=True
    ).exists():
        raise Http404("Property not found")


class AddReviewView(generics.CreateAPIView):

    serializer_class = ReviewWriteSerializer

    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review = serializer.save(user=request.user)

        return Response(
            ReviewSerializer(review).data,
            status=201
        )


class ReviewDetailView(generics.UpdateAPIView, generics.DestroyAPIView):

    serializer_class = ReviewWriteSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Review.objects.filter(
            user=self.request.user
        ).select_related("user")

    def update(self, request, *args, partial=False, **kwargs):

        review = self.get_object()

        serializer = self.get_serializer(
            review,
            data=request.data,
            partial=partial
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(ReviewSerializer(review).data)


class PropertyReviewListView(generics.ListAPIView):

    serializer_class = ReviewSerializer

    def get_queryset(self):

        property_id = self.kwargs["property_id"]

        require_approved_property(property_id)

        return Review.objects.filter(
            property_id=property_id
        ).select_related("user").order_by(
            "-created_at",
            "-id",
        )


class PropertyAverageRatingView(APIView):

    def get(self, request, property_id):

        require_approved_property(property_id)

        avg_rating = Review.objects.filter(
            property_id=property_id
        ).aggregate(
            average=Avg("rating")
        )

        return Response(avg_rating)


class PropertyReviewSummaryView(APIView):

    def get(self, request, property_id):

        require_approved_property(property_id)

        reviews = Review.objects.filter(property_id=property_id)

        stats = reviews.aggregate(
            average=Avg("rating"),
            total=Count("id"),
        )

        distribution = {str(star): 0 for star in range(1, 6)}

        for row in reviews.values("rating").annotate(count=Count("id")):

            if str(row["rating"]) in distribution:
                distribution[str(row["rating"])] = row["count"]

        average = stats["average"]

        return Response({
            "average_rating": round(average, 1) if average is not None else None,
            "total_reviews": stats["total"],
            "distribution": distribution,
        })


class RecentReviewListView(generics.ListAPIView):

    serializer_class = ReviewSerializer

    def get_queryset(self):

        return Review.objects.filter(
            property__is_approved=True
        ).select_related("user").order_by(
            "-created_at",
            "-id",
        )
