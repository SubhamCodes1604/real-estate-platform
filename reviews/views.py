
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from properties.models import Property
from .models import Review
from .serializers import ReviewSerializer


# CREATE REVIEW
class AddReviewView(generics.CreateAPIView):

    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):

        property_id = self.request.data.get("property")

        if property_id is None:
            raise ValidationError({
                "property": "This field is required."
            })

        try:
            property_obj = Property.objects.get(pk=property_id)

        except (Property.DoesNotExist, ValueError, TypeError):
            raise ValidationError({
                "property": "Invalid property."
            })

        if property_obj.created_by_id == self.request.user.id:
            raise PermissionDenied(
                "You cannot review your own property."
            )

        if not property_obj.is_approved:
            raise PermissionDenied(
                "You can only review approved properties."
            )

        if Review.objects.filter(
            property=property_obj,
            user=self.request.user
        ).exists():

            raise ValidationError(
                "You have already reviewed this property. "
                "Edit your existing review instead."
            )

        serializer.save(
            property=property_obj,
            user=self.request.user
        )


# LIST PROPERTY REVIEWS
class PropertyReviewListView(generics.ListAPIView):

    serializer_class = ReviewSerializer

    def get_queryset(self):

        return Review.objects.filter(
            property_id=self.kwargs["property_id"],
            property__is_approved=True
        ).select_related(
            "user",
            "property"
        ).order_by("-created_at")


# GET CURRENT USER'S REVIEW AND OWNER STATUS
class MyPropertyReviewView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, property_id):

        property_obj = get_object_or_404(
            Property,
            pk=property_id
        )

        if not property_obj.is_approved:
            raise PermissionDenied(
                "Reviews are not available for this property."
            )

        review = Review.objects.filter(
            property=property_obj,
            user=request.user
        ).select_related(
            "user",
            "property"
        ).first()

        return Response({
            "review": (
                ReviewSerializer(review).data
                if review else None
            ),
            "is_owner": (
                property_obj.created_by_id == request.user.id
            )
        })


# AVERAGE RATING AND STAR DISTRIBUTION
class PropertyAverageRatingView(APIView):

    def get(self, request, property_id):

        property_obj = get_object_or_404(
            Property,
            pk=property_id
        )

        if not property_obj.is_approved:

            return Response({
                "average": 0,
                "total_reviews": 0,
                "distribution": {
                    str(i): 0 for i in range(1, 6)
                },
                "property_id": property_id,
                "approved": False
            })

        reviews = Review.objects.filter(
            property=property_obj
        )

        aggregate = reviews.aggregate(
            average=Avg("rating"),
            total_reviews=Count("id")
        )

        distribution = {
            str(i): reviews.filter(rating=i).count()
            for i in range(1, 6)
        }

        average = aggregate["average"]

        return Response({
            "average": round(average, 2) if average is not None else 0,
            "total_reviews": aggregate["total_reviews"],
            "distribution": distribution,
            "property_id": property_id,
            "approved": True
        })


# RECENT REVIEWS
class RecentReviewListView(generics.ListAPIView):

    serializer_class = ReviewSerializer

    def get_queryset(self):

        return Review.objects.filter(
            property__is_approved=True
        ).select_related(
            "user",
            "property"
        ).order_by("-created_at")


# EDIT AND DELETE REVIEW
class ReviewDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    http_method_names = [
        "get",
        "patch",
        "put",
        "delete",
        "head",
        "options"
    ]

    def get_object(self):

        obj = get_object_or_404(
            Review.objects.select_related(
                "property",
                "user"
            ),
            pk=self.kwargs["pk"]
        )

        if not obj.property.is_approved:
            raise PermissionDenied(
                "This review is not available."
            )

        if obj.user_id != self.request.user.id:
            raise PermissionDenied(
                "You can only modify or delete your own reviews."
            )

        return obj

    def destroy(self, request, *args, **kwargs):

        instance = self.get_object()

        self.perform_destroy(instance)

        return Response(
            {"detail": "Review deleted successfully."},
            status=status.HTTP_200_OK
        )
