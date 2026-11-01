from rest_framework import serializers
from .models import Property
from bulk_uploads.models import PropertyImage


class PropertyImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = PropertyImage
        fields = ("id", "image", "caption", "order", "created_at")
        read_only_fields = ("id", "created_at")


class PropertySerializer(serializers.ModelSerializer):

    gallery_images = PropertyImageSerializer(
        many=True, read_only=True
    )

    class Meta:
        model = Property
        fields = "__all__"
        read_only_fields = (
            "created_by",
            "is_approved",
            "is_featured",
            "created_at",
        )

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate_area_sqft(self, value):
        if value <= 0:
            raise serializers.ValidationError("Area must be greater than zero.")
        return value

    def validate_bedrooms(self, value):
        if value < 0:
            raise serializers.ValidationError("Bedrooms cannot be negative.")
        return value

    def validate_bathrooms(self, value):
        if value < 0:
            raise serializers.ValidationError("Bathrooms cannot be negative.")
        return value
