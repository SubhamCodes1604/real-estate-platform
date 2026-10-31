from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from properties.models import Property
from .models import Inquiry


class InquiryTestBase(TestCase):

    def setUp(self):

        self.agent = User.objects.create_user(
            username="agent",
            password="TestPass123!",
            role="AGENT",
        )

        self.buyer = User.objects.create_user(
            username="buyer",
            password="TestPass123!",
            role="USER",
        )

        self.other_buyer = User.objects.create_user(
            username="otherbuyer",
            password="TestPass123!",
            role="USER",
        )

        self.admin = User.objects.create_user(
            username="admin",
            password="TestPass123!",
            role="ADMIN",
        )

        self.approved_property = Property.objects.create(
            title="Approved Flat",
            description="A nice flat.",
            property_type="FLAT",
            price="5000000.00",
            bedrooms=2,
            bathrooms=2,
            area_sqft=1000.0,
            address="Some address",
            city="Mumbai",
            state="MH",
            pincode="400001",
            is_approved=True,
            created_by=self.agent,
        )

        self.unapproved_property = Property.objects.create(
            title="Pending Flat",
            description="A pending flat.",
            property_type="FLAT",
            price="3000000.00",
            bedrooms=1,
            bathrooms=1,
            area_sqft=500.0,
            address="Other address",
            city="Pune",
            state="MH",
            pincode="411001",
            is_approved=False,
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


class CreateInquiryTest(InquiryTestBase):

    def test_buyer_creates_inquiry(self):

        self.auth_as("buyer", "TestPass123!")

        response = self.client.post(
            "/api/inquiries/create/",
            {
                "property": self.approved_property.id,
                "message": "Is this still available?",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(response.data["buyer"], self.buyer.id)
        self.assertEqual(
            response.data["message"],
            "Is this still available?",
        )

    def test_agent_blocked_from_creating(self):

        self.auth_as("agent", "TestPass123!")

        response = self.client.post(
            "/api/inquiries/create/",
            {
                "property": self.approved_property.id,
                "message": "I want this.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_blocked_from_creating(self):

        self.auth_as("admin", "TestPass123!")

        response = self.client.post(
            "/api/inquiries/create/",
            {
                "property": self.approved_property.id,
                "message": "Admin inquiry.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_unauthenticated_blocked(self):

        response = self.client.post(
            "/api/inquiries/create/",
            {
                "property": self.approved_property.id,
                "message": "Hello?",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_inquiry_for_unapproved_property_rejected(self):

        self.auth_as("buyer", "TestPass123!")

        response = self.client.post(
            "/api/inquiries/create/",
            {
                "property": self.unapproved_property.id,
                "message": "Interested.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_self_inquiry_rejected(self):

        self.buyer_property = Property.objects.create(
            title="Buyer Own",
            description="desc",
            property_type="FLAT",
            price="1000000.00",
            bedrooms=1,
            bathrooms=1,
            area_sqft=400.0,
            address="addr",
            city="Delhi",
            state="DL",
            pincode="110001",
            is_approved=True,
            created_by=self.buyer,
        )

        self.auth_as("buyer", "TestPass123!")

        response = self.client.post(
            "/api/inquiries/create/",
            {
                "property": self.buyer_property.id,
                "message": "My own property.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_empty_message_rejected(self):

        self.auth_as("buyer", "TestPass123!")

        response = self.client.post(
            "/api/inquiries/create/",
            {
                "property": self.approved_property.id,
                "message": "   ",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_message_trimmed(self):

        self.auth_as("buyer", "TestPass123!")

        response = self.client.post(
            "/api/inquiries/create/",
            {
                "property": self.approved_property.id,
                "message": "  Hello  ",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(response.data["message"], "Hello")

    def test_buyer_derived_from_request(self):

        self.auth_as("buyer", "TestPass123!")

        response = self.client.post(
            "/api/inquiries/create/",
            {
                "property": self.approved_property.id,
                "message": "Test.",
                "buyer": self.agent.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        inquiry = Inquiry.objects.get(id=response.data["id"])
        self.assertEqual(inquiry.buyer_id, self.buyer.id)


class MyInquiryTest(InquiryTestBase):

    def test_buyer_views_own_inquiries(self):

        Inquiry.objects.create(
            property=self.approved_property,
            buyer=self.buyer,
            message="Inquiry 1",
        )

        Inquiry.objects.create(
            property=self.approved_property,
            buyer=self.other_buyer,
            message="Inquiry 2",
        )

        self.auth_as("buyer", "TestPass123!")

        response = self.client.get(
            "/api/inquiries/my/"
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

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["message"], "Inquiry 1")

    def test_agent_blocked_from_my_inquiries(self):

        self.auth_as("agent", "TestPass123!")

        response = self.client.get(
            "/api/inquiries/my/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )


class ReceivedInquiryTest(InquiryTestBase):

    def test_agent_views_own_property_inquiries(self):

        Inquiry.objects.create(
            property=self.approved_property,
            buyer=self.buyer,
            message="Interested.",
        )

        other_property = Property.objects.create(
            title="Other Agent Property",
            description="desc",
            property_type="HOUSE",
            price="2000000.00",
            bedrooms=3,
            bathrooms=2,
            area_sqft=1500.0,
            address="addr",
            city="Delhi",
            state="DL",
            pincode="110001",
            is_approved=True,
            created_by=self.buyer,
        )

        Inquiry.objects.create(
            property=other_property,
            buyer=self.other_buyer,
            message="Other inquiry.",
        )

        self.auth_as("agent", "TestPass123!")

        response = self.client.get(
            "/api/inquiries/received/"
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

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["message"], "Interested.")

    def test_buyer_blocked_from_received_inquiries(self):

        self.auth_as("buyer", "TestPass123!")

        response = self.client.get(
            "/api/inquiries/received/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_received_inquiries_newest_first(self):

        Inquiry.objects.create(
            property=self.approved_property,
            buyer=self.buyer,
            message="First inquiry.",
        )

        Inquiry.objects.create(
            property=self.approved_property,
            buyer=self.other_buyer,
            message="Second inquiry.",
        )

        self.auth_as("agent", "TestPass123!")

        response = self.client.get(
            "/api/inquiries/received/"
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        self.assertEqual(len(results), 2)
        self.assertGreaterEqual(
            results[0]["created_at"],
            results[1]["created_at"],
        )
