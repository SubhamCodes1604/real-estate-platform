from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from properties.models import Property
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):

    user_name = serializers.CharField(
        source="user.username",
        read_only=True
    )

    class Meta:
        model = Review

        fields = (
            "id",
            "property",
            "user",
            "user_name",
            "rating",
            "comment",
            "created_at",
        )

        read_only_fields = (
            "user",
            "created_at",
        )


class ReviewWriteSerializer(serializers.ModelSerializer):

    property = serializers.PrimaryKeyRelatedField(
        queryset=Property.objects.filter(is_approved=True),
        required=False,
    )

    rating = serializers.IntegerField(
        min_value=1,
        max_value=5,
    )

    comment = serializers.CharField()

    class Meta:
        model = Review

        fields = (
            "property",
            "rating",
            "comment",
        )

    def validate(self, attrs):

        request = self.context["request"]

        if self.instance is None:
            return self._validate_new_review(attrs, request.user)

        return self._validate_review_update(attrs)

    def _validate_new_review(self, attrs, user):

        property_obj = attrs.get("property")

        if property_obj is None:
            raise serializers.ValidationError({
                "property": ["This field is required."]
            })

        if property_obj.created_by_id == user.id:
            raise PermissionDenied(
                "You cannot review your own property."
            )

        if Review.objects.filter(
            property=property_obj,
            user=user
        ).exists():
            raise serializers.ValidationError({
                "property": [
                    "You have already reviewed this property. "
                    "Edit your existing review instead."
                ]
            })

        return attrs

    def _validate_review_update(self, attrs):

        new_property = attrs.get("property")

        if new_property is not None and new_property.pk != self.instance.property_id:
            raise serializers.ValidationError({
                "property": ["The property of a review cannot be changed."]
            })

        attrs.pop("property", None)

        return attrs
