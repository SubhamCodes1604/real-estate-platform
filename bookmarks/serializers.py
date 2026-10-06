from rest_framework import serializers

from properties.models import Property
from .models import Bookmark
from properties.serializers import PropertySerializer


class BookmarkSerializer(serializers.ModelSerializer):

    property = PropertySerializer(read_only=True)

    property_id = serializers.IntegerField(
        write_only=True
    )

    class Meta:
        model = Bookmark

        fields = (
            "id",
            "created_at",
            "property",
            "property_id",
        )

    def create(self, validated_data):

        property_id = validated_data.pop("property_id")

        try:
            property_obj = Property.objects.get(
            id=property_id
        )
        except Property.DoesNotExist:
            raise serializers.ValidationError(
                "Property does not exist."
            )

        user = validated_data["user"]

        if Bookmark.objects.filter(
            user=user,
            property=property_obj
        ).exists():

            raise serializers.ValidationError(
            "Property already bookmarked."
        )

        return Bookmark.objects.create(
        user=user,
        property=property_obj
    )