from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from .models import Property


class PropertyApprovalTestBase(TestCase):

    def setUp(self):

        self.agent = User.objects.create_user(
            username="testagent",
            password="TestPass123!",
            role="AGENT",
        )

        self.admin = User.objects.create_user(
            username="testadmin",
            password="TestPass123!",
            role="ADMIN",
            is_staff=True,
        )

        self.regular_user = User.objects.create_user(
            username="regularuser",
            password="TestPass123!",
            role="USER",
        )

        self.pending_property = Property.objects.create(
            title="Pending Property",
            description="Awaiting approval",
            property_type="FLAT",
            price="3000000",
            bedrooms=1,
            bathrooms=1,
            area_sqft=500,
            address="Test Address",
            city="Pune",
            state="Maharashtra",
            pincode="411001",
            is_approved=False,
            created_by=self.agent,
        )

        self.approved_property = Property.objects.create(
            title="Approved Property",
            description="Already approved",
            property_type="HOUSE",
            price="8000000",
            bedrooms=3,
            bathrooms=2,
            area_sqft=1500,
            address="Test Address 2",
            city="Mumbai",
            state="Maharashtra",
            pincode="400001",
            is_approved=True,
            created_by=self.agent,
        )

        self.client = APIClient()

    def get_jwt_token(self, username, password):

        response = self.client.post(
            "/api/accounts/login/",
            {"username": username, "password": password},
            format="json",
        )

        return response.data["access"]


class PendingPropertiesListTest(PropertyApprovalTestBase):

    def test_admin_can_view_pending(self):

        token = self.get_jwt_token(
            "testadmin", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.get(
            "/api/properties/pending/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        self.assertEqual(len(results), 1)
        self.assertEqual(
            results[0]["title"], "Pending Property"
        )

    def test_non_admin_cannot_view_pending(self):

        token = self.get_jwt_token(
            "regularuser", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.get(
            "/api/properties/pending/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_403_FORBIDDEN
        )


class ApprovePropertyTest(PropertyApprovalTestBase):

    def test_admin_can_approve(self):

        token = self.get_jwt_token(
            "testadmin", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.patch(
            f"/api/properties/approve/{self.pending_property.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )

        self.pending_property.refresh_from_db()
        self.assertTrue(
            self.pending_property.is_approved
        )

    def test_non_admin_cannot_approve(self):

        token = self.get_jwt_token(
            "regularuser", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.patch(
            f"/api/properties/approve/{self.pending_property.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_403_FORBIDDEN
        )

        self.pending_property.refresh_from_db()
        self.assertFalse(
            self.pending_property.is_approved
        )


class RejectPropertyTest(PropertyApprovalTestBase):

    def test_admin_can_reject_approved_property(self):

        token = self.get_jwt_token(
            "testadmin", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.patch(
            f"/api/properties/reject/{self.approved_property.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )

        self.approved_property.refresh_from_db()
        self.assertFalse(
            self.approved_property.is_approved
        )

    def test_non_admin_cannot_reject(self):

        token = self.get_jwt_token(
            "regularuser", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.patch(
            f"/api/properties/reject/{self.approved_property.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_403_FORBIDDEN
        )

        self.approved_property.refresh_from_db()
        self.assertTrue(
            self.approved_property.is_approved
        )

    def test_reject_nonexistent_property_returns_404(self):

        token = self.get_jwt_token(
            "testadmin", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.patch(
            "/api/properties/reject/99999/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_404_NOT_FOUND
        )
