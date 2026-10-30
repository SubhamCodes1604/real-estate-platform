from django.urls import path

from .views import (
    AddReviewView,
    PropertyReviewListView,
    PropertyAverageRatingView,
    PropertyReviewSummaryView,
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
        "<int:pk>/",
        ReviewDetailView.as_view(),
        name="review-detail"
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
        "property/<int:property_id>/summary/",
        PropertyReviewSummaryView.as_view(),
        name="property-review-summary"
    ),

    path(
        "recent/",
        RecentReviewListView.as_view(),
        name="recent-reviews"
    ),
]
