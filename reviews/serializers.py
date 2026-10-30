
from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):

    user_username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    property_title = serializers.CharField(
        source="property.title",
        read_only=True
    )

    class Meta:
        model = Review

        fields = [
            "id",
            "property",
            "property_title",
            "user",
            "user_username",
            "rating",
            "comment",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "property",
            "property_title",
            "user",
            "user_username",
            "created_at",
        ]

    def validate_rating(self, value):

        if isinstance(value, bool) or not isinstance(value, int):
            raise serializers.ValidationError(
                "Rating must be an integer."
            )

        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Rating must be between 1 and 5."
            )

        return value

    def validate_comment(self, value):

        if not value or not value.strip():
            raise serializers.ValidationError(
                "Review comment cannot be empty."
            )

        return value.strip()
