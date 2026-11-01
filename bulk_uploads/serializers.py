from rest_framework import serializers

from .models import BulkUpload, PropertyImage


class PropertyImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = PropertyImage
        fields = (
            "id",
            "image",
            "caption",
            "order",
            "created_at",
        )
        read_only_fields = (
            "id",
            "created_at",
        )


class BulkUploadSerializer(serializers.ModelSerializer):

    class Meta:
        model = BulkUpload
        fields = (
            "id",
            "agent",
            "total_rows",
            "imported_rows",
            "failed_rows",
            "errors",
            "status",
            "created_at",
        )
        read_only_fields = (
            "id",
            "agent",
            "total_rows",
            "imported_rows",
            "failed_rows",
            "errors",
            "status",
            "created_at",
        )
