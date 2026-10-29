from django.urls import path

from .views import (
    AddBookmarkView,
    BookmarkListView,
    RemoveBookmarkView,
    BookmarkStatusView
)

urlpatterns = [

    path(
        "add/",
        AddBookmarkView.as_view(),
        name="add-bookmark"
    ),

    path(
        "list/",
        BookmarkListView.as_view(),
        name="bookmark-list"
    ),

    path(
        "remove/<int:pk>/",
        RemoveBookmarkView.as_view(),
        name="remove-bookmark"
    ),

    path(
        "status/<int:property_id>/",
        BookmarkStatusView.as_view(),
        name="bookmark-status"
    ),
]
