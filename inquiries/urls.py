from django.urls import path
from .views import (
    CreateInquiryView,
    MyInquiryView,
    PropertyInquiryListView
)

urlpatterns = [

    path(
        "create/",
        CreateInquiryView.as_view(),
        name="create-inquiry"
    ),

    path(
        "my/",
        MyInquiryView.as_view(),
        name="my-inquiries"
    ),
    path(
        "received/",
        PropertyInquiryListView.as_view(),
    name="received-inquiries"
    ),
]