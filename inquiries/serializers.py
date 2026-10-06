from rest_framework import serializers

from .models import Inquiry
from properties.serializers import PropertySerializer


class InquirySerializer(serializers.ModelSerializer):

    property_details = PropertySerializer(
        source="property",
        read_only=True
    )

    buyer_username = serializers.CharField(
        source="buyer.username",
        read_only=True
    )

    class Meta:
        model = Inquiry

        fields = (
            "id",
            "property",
            "property_details",
            "buyer",
            "buyer_username",
            "message",
            "created_at",
        )

        read_only_fields = (
            "buyer",
            "buyer_username",
            "property_details",
            "created_at",
        )