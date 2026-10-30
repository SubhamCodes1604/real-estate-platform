from django.urls import path

from .views import (
    AddReviewView,
    PropertyReviewListView,
    PropertyAverageRatingView,
    RecentReviewListView,
    ReviewDetailView,
)

urlpatterns = [
    path(
        "add/",
        AddReviewView.as_view(),
        name="add-review"
    ),

    path(
        "property/<int:property_id>/",
        PropertyReviewListView.as_view(),
        name="property-reviews"
    ),

    path(
        "property/<int:property_id>/average/",
        PropertyAverageRatingView.as_view(),
        name="property-average-rating"
    ),

    path(
        "recent/",
        RecentReviewListView.as_view(),
        name="recent-reviews"
    ),

    path(
        "<int:pk>/",
        ReviewDetailView.as_view(),
        name="review-detail"
    ),
]
