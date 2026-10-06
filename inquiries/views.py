from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Inquiry
from .serializers import InquirySerializer


class CreateInquiryView(generics.CreateAPIView):

    serializer_class = InquirySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(
            buyer=self.request.user
        )


class MyInquiryView(generics.ListAPIView):

    serializer_class = InquirySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Inquiry.objects.filter(
            buyer=self.request.user
        )

class PropertyInquiryListView(generics.ListAPIView):

    serializer_class = InquirySerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):

        return Inquiry.objects.filter(
            property__created_by=self.request.user
        )
