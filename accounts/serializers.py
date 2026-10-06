from rest_framework import serializers
from .models import User

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User

        fields = (
            "id",
            "username",
            "email",
            "password",
            "role",
        )

    def validate_role(self, value):

        if value not in ["USER", "AGENT"]:
            raise serializers.ValidationError(
                "You can only register as a User or Agent."
            )

        return value

    def create(self, validated_data):

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            role=validated_data.get("role", "USER")
        )

        return user

class UserProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "role",
        )