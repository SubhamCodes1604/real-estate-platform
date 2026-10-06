from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from properties.models import Property
from bookmarks.models import Bookmark
from inquiries.models import Inquiry
from reviews.models import Review
from accounts.models import User
from rest_framework.permissions import IsAdminUser


class AdminStatsView(APIView):

    permission_classes = [IsAdminUser]

    def get(self, request):

        total_properties = Property.objects.count()

        approved_properties = Property.objects.filter(
            is_approved=True
        ).count()

        featured_properties = Property.objects.filter(
            is_featured=True
        ).count()

        total_users = User.objects.count()

        total_reviews = Review.objects.count()

        total_bookmarks = Bookmark.objects.count()

        total_inquiries = Inquiry.objects.count()

        return Response({
            "total_properties": total_properties,
            "approved_properties": approved_properties,
            "featured_properties": featured_properties,
            "total_users": total_users,
            "total_reviews": total_reviews,
            "total_bookmarks": total_bookmarks,
            "total_inquiries": total_inquiries,
        })