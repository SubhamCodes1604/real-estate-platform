from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from .models import Property


class PropertyTestBase(TestCase):

    def setUp(self):

        self.agent = User.objects.create_user(
            username="testagent",
            password="TestPass123!",
            role="AGENT",
        )

        self.other_agent = User.objects.create_user(
            username="otheragent",
            password="TestPass123!",
            role="AGENT",
        )

        self.admin = User.objects.create_user(
            username="testadmin",
            password="TestPass123!",
            role="ADMIN",
            is_staff=True,
        )

        self.user = User.objects.create_user(
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

    def auth_as(self, username, password):

        token = self.get_jwt_token(username, password)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )


class PropertyListTest(PropertyTestBase):

    def test_list_shows_only_approved(self):

        response = self.client.get(
            "/api/properties/list/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        for prop in results:
            self.assertTrue(prop["is_approved"])

    def test_list_unauthenticated_allowed(self):

        response = self.client.get(
            "/api/properties/list/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_list_filter_by_city(self):

        response = self.client.get(
            "/api/properties/list/?city=Mumbai"
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        for prop in results:
            self.assertEqual(prop["city"], "Mumbai")

    def test_list_search(self):

        response = self.client.get(
            "/api/properties/list/?search=Approved"
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        self.assertTrue(
            any("Approved" in p["title"] for p in results)
        )


class PropertyDetailTest(PropertyTestBase):

    def test_detail_approved_property(self):

        response = self.client.get(
            f"/api/properties/detail/{self.approved_property.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["title"], "Approved Property"
        )

    def test_detail_unapproved_returns_404(self):

        response = self.client.get(
            f"/api/properties/detail/{self.pending_property.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )


class PropertyCreateTest(PropertyTestBase):

    def test_agent_can_create(self):

        self.auth_as("testagent", "TestPass123!")

        response = self.client.post(
            "/api/properties/create/",
            {
                "title": "New Property",
                "description": "A new property.",
                "property_type": "FLAT",
                "price": "5000000",
                "bedrooms": 2,
                "bathrooms": 2,
                "area_sqft": 1000,
                "address": "Address",
                "city": "Mumbai",
                "state": "MH",
                "pincode": "400001",
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertFalse(response.data["is_approved"])

    def test_unauthenticated_cannot_create(self):

        response = self.client.post(
            "/api/properties/create/",
            {
                "title": "New Property",
                "description": "desc",
                "property_type": "FLAT",
                "price": "5000000",
                "bedrooms": 2,
                "bathrooms": 2,
                "area_sqft": 1000,
                "address": "Address",
                "city": "Mumbai",
                "state": "MH",
                "pincode": "400001",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )


class PropertyUpdateTest(PropertyTestBase):

    def test_owner_can_update(self):

        self.auth_as("testagent", "TestPass123!")

        response = self.client.patch(
            f"/api/properties/update/{self.approved_property.id}/",
            {"title": "Updated Title"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["title"], "Updated Title"
        )

    def test_other_agent_cannot_update(self):

        self.auth_as("otheragent", "TestPass123!")

        response = self.client.patch(
            f"/api/properties/update/{self.approved_property.id}/",
            {"title": "Hijacked"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )


class PropertyDeleteTest(PropertyTestBase):

    def test_owner_can_delete(self):

        self.auth_as("testagent", "TestPass123!")

        response = self.client.delete(
            f"/api/properties/delete/{self.approved_property.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

    def test_other_agent_cannot_delete(self):

        self.auth_as("otheragent", "TestPass123!")

        response = self.client.delete(
            f"/api/properties/delete/{self.approved_property.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )


class MyPropertiesTest(PropertyTestBase):

    def test_agent_sees_own_properties(self):

        self.auth_as("testagent", "TestPass123!")

        response = self.client.get(
            "/api/properties/my-properties/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        self.assertEqual(len(results), 2)

    def test_other_agent_sees_own_only(self):

        self.auth_as("otheragent", "TestPass123!")

        response = self.client.get(
            "/api/properties/my-properties/"
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        self.assertEqual(len(results), 0)


class PendingPropertiesListTest(PropertyTestBase):

    def test_admin_can_view_pending(self):

        self.auth_as("testadmin", "TestPass123!")

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

        self.auth_as("regularuser", "TestPass123!")

        response = self.client.get(
            "/api/properties/pending/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_403_FORBIDDEN
        )


class ApprovePropertyTest(PropertyTestBase):

    def test_admin_can_approve(self):

        self.auth_as("testadmin", "TestPass123!")

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

        self.auth_as("regularuser", "TestPass123!")

        response = self.client.patch(
            f"/api/properties/approve/{self.pending_property.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_403_FORBIDDEN
        )


class RejectPropertyTest(PropertyTestBase):

    def test_admin_can_reject_approved_property(self):

        self.auth_as("testadmin", "TestPass123!")

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

        self.auth_as("regularuser", "TestPass123!")

        response = self.client.patch(
            f"/api/properties/reject/{self.approved_property.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_403_FORBIDDEN
        )

    def test_reject_nonexistent_property_returns_404(self):

        self.auth_as("testadmin", "TestPass123!")

        response = self.client.patch(
            "/api/properties/reject/99999/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_404_NOT_FOUND
        )
