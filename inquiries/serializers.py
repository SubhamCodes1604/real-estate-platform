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

    is_answered = serializers.SerializerMethodField()

    class Meta:
        model = Inquiry

        fields = (
            "id",
            "property",
            "property_details",
            "buyer",
            "buyer_username",
            "message",
            "response",
            "responded_at",
            "is_answered",
            "created_at",
        )

        read_only_fields = (
            "id",
            "buyer",
            "buyer_username",
            "property_details",
            "response",
            "responded_at",
            "is_answered",
            "created_at",
        )

    def validate_message(self, value):

        if not value or not value.strip():

            raise serializers.ValidationError(
                "Message cannot be empty."
            )

        return value.strip()

    def get_is_answered(self, obj):

        return bool(obj.response and obj.response.strip())
