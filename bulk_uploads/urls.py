from django.urls import path

from .views import (
    BulkUploadPreviewView,
    BulkUploadImportView,
    BulkUploadHistoryView,
    BulkUploadDetailView,
    BulkUploadTemplateView,
)

urlpatterns = [
    path(
        "preview/",
        BulkUploadPreviewView.as_view(),
        name="bulk-upload-preview",
    ),
    path(
        "import/",
        BulkUploadImportView.as_view(),
        name="bulk-upload-import",
    ),
    path(
        "history/",
        BulkUploadHistoryView.as_view(),
        name="bulk-upload-history",
    ),
    path(
        "<int:pk>/",
        BulkUploadDetailView.as_view(),
        name="bulk-upload-detail",
    ),
    path(
        "template/",
        BulkUploadTemplateView.as_view(),
        name="bulk-upload-template",
    ),
]
