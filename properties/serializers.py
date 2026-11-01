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
            "created_at",
        )
