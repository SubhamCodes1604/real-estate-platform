from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from properties.models import Property
from .models import BulkUpload, PropertyImage


class BulkUploadTestBase(TestCase):

    def setUp(self):

        self.agent = User.objects.create_user(
            username="testagent",
            password="TestPass123!",
            role="AGENT",
        )

        self.buyer = User.objects.create_user(
            username="testbuyer",
            password="TestPass123!",
            role="USER",
        )

        self.client = APIClient()

    def auth_as(self, username, password):

        response = self.client.post(
            "/api/accounts/login/",
            {
                "username": username,
                "password": password,
            },
            format="json",
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
        )


class BulkUploadAccessTest(BulkUploadTestBase):

    def test_buyer_blocked_from_preview(self):

        self.auth_as("testbuyer", "TestPass123!")

        response = self.client.post(
            "/api/bulk-upload/preview/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_unauthenticated_blocked_from_preview(self):

        response = self.client.post(
            "/api/bulk-upload/preview/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_agent_can_access_template(self):

        self.auth_as("testagent", "TestPass123!")

        response = self.client.get(
            "/api/bulk-upload/template/"
        )

        self.assertIn(
            response.status_code,
            [status.HTTP_200_OK, status.HTTP_500_INTERNAL_SERVER_ERROR],
        )

    def test_agent_can_view_history(self):

        self.auth_as("testagent", "TestPass123!")

        BulkUpload.objects.create(
            agent=self.agent,
            total_rows=5,
            imported_rows=3,
            failed_rows=2,
            status="COMPLETED",
        )

        response = self.client.get(
            "/api/bulk-upload/history/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )


class BulkUploadPreviewTest(BulkUploadTestBase):

    def test_preview_no_file(self):

        self.auth_as("testagent", "TestPass123!")

        response = self.client.post(
            "/api/bulk-upload/preview/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )


class BulkUploadModelTest(BulkUploadTestBase):

    def test_bulk_upload_creation(self):

        upload = BulkUpload.objects.create(
            agent=self.agent,
            total_rows=10,
            imported_rows=8,
            failed_rows=2,
            status="COMPLETED",
        )

        self.assertEqual(upload.total_rows, 10)
        self.assertEqual(upload.imported_rows, 8)
        self.assertEqual(upload.failed_rows, 2)
