from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from properties.models import Property
from .models import Inquiry
from .serializers import InquirySerializer


class IsBuyer(permissions.BasePermission):

    def has_permission(self, request, view):

        return (
            request.user.is_authenticated
            and request.user.role == "USER"
        )


class IsAgent(permissions.BasePermission):

    def has_permission(self, request, view):

        return (
            request.user.is_authenticated
            and request.user.role == "AGENT"
        )


class CreateInquiryView(generics.CreateAPIView):

    serializer_class = InquirySerializer
    permission_classes = [IsBuyer]

    def perform_create(self, serializer):

        property_id = self.request.data.get("property")

        if property_id is None:

            raise ValidationError(
                {"property": "This field is required."}
            )

        try:

            property_obj = Property.objects.get(
                pk=property_id
            )

        except (Property.DoesNotExist, ValueError, TypeError):

            raise ValidationError(
                {"property": "Invalid property."}
            )

        if not property_obj.is_approved:

            raise PermissionDenied(
                "You can only inquire about approved properties."
            )

        if property_obj.created_by_id == self.request.user.id:

            raise PermissionDenied(
                "You cannot send an inquiry about your own property."
            )

        serializer.save(
            buyer=self.request.user,
            property=property_obj,
        )


class MyInquiryView(generics.ListAPIView):

    serializer_class = InquirySerializer
    permission_classes = [IsBuyer]

    def get_queryset(self):

        return Inquiry.objects.filter(
            buyer=self.request.user
        ).select_related(
            "property", "buyer"
        ).order_by("-created_at")


class PropertyInquiryListView(generics.ListAPIView):

    serializer_class = InquirySerializer
    permission_classes = [IsAgent]

    def get_queryset(self):

        return Inquiry.objects.filter(
            property__created_by=self.request.user
        ).select_related(
            "property", "buyer"
        ).order_by("-created_at")


class RespondToInquiryView(APIView):

    permission_classes = [IsAgent]

    def patch(self, request, pk):

        inquiry = self._get_owned_inquiry(request, pk)

        response_text = request.data.get("response", "")

        if not response_text or not response_text.strip():

            return Response(
                {"response": "Response cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_first_response = not inquiry.response

        inquiry.response = response_text.strip()

        if is_first_response:

            from django.utils import timezone

            inquiry.responded_at = timezone.now()

        inquiry.save(update_fields=[
            "response", "responded_at"
        ])

        serializer = InquirySerializer(
            inquiry,
            context={"request": request}
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    @staticmethod
    def _get_owned_inquiry(request, pk):

        try:

            inquiry = Inquiry.objects.select_related(
                "property", "buyer"
            ).get(pk=pk)

        except (Inquiry.DoesNotExist, ValueError, TypeError):

            raise PermissionDenied(
                "Inquiry not found or you do not have "
                "permission to respond to it."
            )

        if inquiry.property.created_by_id != request.user.id:

            raise PermissionDenied(
                "You can only respond to inquiries "
                "concerning your own properties."
            )

        return inquiry
