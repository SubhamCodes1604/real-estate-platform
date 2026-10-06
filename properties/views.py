from decimal import Decimal

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import (
    MultiPartParser,
    FormParser
)
from .models import Property
from .serializers import PropertySerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from django.db.models import Q, Case, When, Value, IntegerField
from rest_framework import filters
from ai_engine.services import get_similar_properties, get_personalized_recommendations

class CreatePropertyView(generics.CreateAPIView):

    serializer_class = PropertySerializer

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    def perform_create(self, serializer):

        serializer.save(
            created_by=self.request.user
        )

class PropertyListView(generics.ListAPIView):

    serializer_class = PropertySerializer
    filter_backends = [filters.OrderingFilter]

    ordering_fields = [
        "price",
        "created_at",
        "bedrooms",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):

        queryset = Property.objects.filter(is_approved=True)

        search = self.request.query_params.get("search")
        city = self.request.query_params.get("city")
        property_type = self.request.query_params.get("property_type")
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        bedrooms = self.request.query_params.get("bedrooms")

        if bedrooms:
            queryset = queryset.filter(
            bedrooms=bedrooms
        )

        if city:
            queryset = queryset.filter(
                city__icontains=city
            )

        if property_type:
            queryset = queryset.filter(
                property_type=property_type
            )

        if min_price:
            queryset = queryset.filter(
                price__gte=min_price
            )

        if max_price:
            queryset = queryset.filter(
                price__lte=max_price
            )

        if search:
            queryset = queryset.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search) |
            Q(city__icontains=search) |
            Q(address__icontains=search)
        )
        return queryset

class PropertyDetailView(generics.RetrieveAPIView):

    serializer_class = PropertySerializer

    def get_queryset(self):

        return Property.objects.filter(
            is_approved=True
        )
    
class PropertyUpdateView(generics.UpdateAPIView):

    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Property.objects.filter(
            created_by=self.request.user
        )

    def perform_update(self, serializer):

        serializer.save(
            created_by=self.request.user
        )

class PropertyDeleteView(generics.DestroyAPIView):

    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Property.objects.filter(
            created_by=self.request.user
        )

class ApprovePropertyView(APIView):

    permission_classes = [IsAdminUser]

    def patch(self, request, pk):

        try:
            property_obj = Property.objects.get(pk=pk)

            property_obj.is_approved = True
            property_obj.save()

            return Response(
                {"message": "Property approved successfully"},
                status=status.HTTP_200_OK
            )

        except Property.DoesNotExist:

            return Response(
                {"error": "Property not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class MyPropertiesView(generics.ListAPIView):

    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Property.objects.filter(
            created_by=self.request.user
        )

class FeaturedPropertyListView(generics.ListAPIView):

    serializer_class = PropertySerializer

    def get_queryset(self):

        return Property.objects.filter(
            is_featured=True,
            is_approved=True
        )

class RecentPropertyListView(generics.ListAPIView):

    serializer_class = PropertySerializer

    def get_queryset(self):

        return Property.objects.filter(
            is_approved=True
        ).order_by(
            "-created_at"
        )

class PropertyRecommendationView(generics.ListAPIView):

    serializer_class = PropertySerializer

    def get_queryset(self):

        property_id = self.request.query_params.get("property_id")

        if not property_id:
            return Property.objects.none()

        try:
            property_obj = Property.objects.get(
                id=property_id,
                is_approved=True
            )
        except Property.DoesNotExist:
            return Property.objects.none()

        queryset = Property.objects.filter(
            is_approved=True
        ).exclude(
            id=property_obj.id
        )

        # Same city
        queryset = queryset.filter(
            city__iexact=property_obj.city
        )

        # Similar bedrooms
        queryset = queryset.filter(
            bedrooms__gte=property_obj.bedrooms - 1,
            bedrooms__lte=property_obj.bedrooms + 1
        )

        # Similar price range: ±20%
        min_price = property_obj.price * Decimal("0.8")
        max_price = property_obj.price * Decimal("1.2")

        queryset = queryset.filter(
            price__gte=min_price,
            price__lte=max_price
        )

        return queryset.order_by("-created_at")[:10]

class PersonalizedRecommendationView(generics.ListAPIView):

    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        bookmarked_properties = Property.objects.filter(
            bookmarks__user=user
        ).distinct()

        # If user has no bookmarks
        if not bookmarked_properties.exists():

            return Property.objects.filter(
                is_approved=True
            ).order_by("-created_at")[:10]

        # Get preferences from bookmarked properties
        cities = bookmarked_properties.values_list(
            "city",
            flat=True
        ).distinct()

        property_types = bookmarked_properties.values_list(
            "property_type",
            flat=True
        ).distinct()

        bedrooms = bookmarked_properties.values_list(
            "bedrooms",
            flat=True
        ).distinct()

        # Find approved properties matching
        # at least one preference
        queryset = Property.objects.filter(
            is_approved=True
        ).exclude(
            bookmarks__user=user
        ).filter(
            Q(city__in=cities) |
            Q(property_type__in=property_types) |
            Q(bedrooms__in=bedrooms)
        ).distinct()

        # Rank properties by number of matching preferences
        queryset = queryset.annotate(
            recommendation_score=(
                Case(
                    When(city__in=cities, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField()
                )
                +
                Case(
                    When(
                        property_type__in=property_types,
                        then=Value(1)
                    ),
                    default=Value(0),
                    output_field=IntegerField()
                )
                +
                Case(
                    When(bedrooms__in=bedrooms, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField()
                )
            )
        ).order_by(
            "-recommendation_score",
            "-created_at"
        )

        return queryset[:10]

class MLPropertyRecommendationView(APIView):

    def get(self, request):

        property_id = request.query_params.get("property_id")

        if not property_id:
            return Response(
                {
                    "error": "property_id is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            property_id = int(property_id)

        except ValueError:
            return Response(
                {
                    "error": "property_id must be an integer"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        recommendations = get_similar_properties(
            property_id
        )

        if not recommendations:
            return Response(
                {
                    "property_id": property_id,
                    "recommendations": []
                },
                status=status.HTTP_200_OK
            )

        results = []

        for item in recommendations:

            property_obj = item["property"]

            results.append({
                "id": property_obj.id,
                "title": property_obj.title,
                "price": property_obj.price,
                "city": property_obj.city,
                "property_type": property_obj.property_type,
                "bedrooms": property_obj.bedrooms,
                "bathrooms": property_obj.bathrooms,
                "similarity_score": round(
                    item["score"],
                    4
                )
            })

        return Response(
            {
                "property_id": property_id,
                "recommendations": results
            },
            status=status.HTTP_200_OK
        )

class PersonalizedMLRecommendationView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        recommendations = get_personalized_recommendations(
            request.user
        )

        results = []

        for item in recommendations:

            property_obj = item["property"]

            text_score = item.get(
                "text_score",
                0
            )

            numerical_score = item.get(
                "numerical_score",
                0
            )

            reasons = []

            if text_score >= 0.5:
                reasons.append(
                    "matches your preferred property information"
                )

            if numerical_score >= 0.5:
                reasons.append(
                    "has similar property features"
                )

            if property_obj.city:
                reasons.append(
                    f"is located in {property_obj.city}"
                )

            if not reasons:
                reasons.append(
                    "has characteristics similar to your bookmarked properties"
                )

            reason = "Recommended because it " + ", ".join(
                reasons
            ) + "."

            results.append({
                "id": property_obj.id,
                "title": property_obj.title,
                "price": property_obj.price,
                "city": property_obj.city,
                "property_type": property_obj.property_type,
                "bedrooms": property_obj.bedrooms,
                "bathrooms": property_obj.bathrooms,
                "similarity_score": item["score"],
                "text_score": text_score,
                "numerical_score": numerical_score,
                "reason": reason
            })

        return Response({
            "user_id": request.user.id,
            "recommendations": results
        })