from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from bookmarks.models import Bookmark
from inquiries.models import Inquiry
from properties.models import Property


PROPERTY_DATA = {
    "title": "Secure Property",
    "description": "Security test listing",
    "property_type": "FLAT",
    "price": "5000000",
    "bedrooms": 2,
    "bathrooms": 2,
    "area_sqft": 1000,
    "address": "Test Address",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
}


def make_user(username, role, **extra):
    return User.objects.create_user(
        username=username,
        password="TestPass123!",
        role=role,
        **extra,
    )


def make_property(owner, approved, **extra):
    values = {**PROPERTY_DATA, "title": f"{owner.username}-{approved}"}
    values.update(extra)
    return Property.objects.create(
        is_approved=approved,
        created_by=owner,
        **values,
    )


class RoleGatingTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin_url = "/api/accounts/admin/users/"

    def test_admin_role_grants_admin_access_without_staff_flag(self):
        admin = make_user("roleadmin", "ADMIN")
        self.client.force_authenticate(user=admin)

        response = self.client.get(self.admin_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_staff_flag_without_admin_role_is_denied(self):
        staff_agent = make_user("staffagent", "AGENT", is_staff=True)
        self.client.force_authenticate(user=staff_agent)

        response = self.client.get(self.admin_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_request_to_admin_endpoint_is_rejected(self):
        response = self.client.get(self.admin_url)

        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_buyer_cannot_create_property(self):
        buyer = make_user("buyer1", "USER")
        self.client.force_authenticate(user=buyer)

        response = self.client.post(
            "/api/properties/create/", PROPERTY_DATA, format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class PropertyVisibilityTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.agent = make_user("agentA", "AGENT")
        self.other_agent = make_user("agentB", "AGENT")
        self.admin = make_user("adminX", "ADMIN")
        self.approved = make_property(self.agent, approved=True)
        self.pending = make_property(self.agent, approved=False)

    def test_anonymous_list_excludes_pending_properties(self):
        response = self.client.get("/api/properties/list/")

        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.approved.id, ids)
        self.assertNotIn(self.pending.id, ids)

    def test_other_agent_cannot_see_pending_property_by_id(self):
        self.client.force_authenticate(user=self.other_agent)

        response = self.client.get(
            f"/api/properties/detail/{self.pending.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_other_agent_can_see_approved_property_by_id(self):
        self.client.force_authenticate(user=self.other_agent)

        response = self.client.get(
            f"/api/properties/detail/{self.approved.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_owner_agent_can_see_own_pending_property(self):
        self.client.force_authenticate(user=self.agent)

        response = self.client.get(
            f"/api/properties/detail/{self.pending.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_other_agent_cannot_update_property(self):
        self.client.force_authenticate(user=self.other_agent)

        response = self.client.patch(
            f"/api/properties/update/{self.approved.id}/",
            {"title": "Hijacked"},
            format="json",
        )

        self.approved.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.approved.created_by, self.agent)
        self.assertNotEqual(self.approved.title, "Hijacked")

    def test_owner_update_keeps_ownership(self):
        self.client.force_authenticate(user=self.agent)

        response = self.client.patch(
            f"/api/properties/update/{self.approved.id}/",
            {"title": "Renamed"},
            format="json",
        )

        self.approved.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.approved.created_by, self.agent)

    def test_agent_cannot_set_is_featured_on_create(self):
        self.client.force_authenticate(user=self.agent)

        response = self.client.post(
            "/api/properties/create/",
            {**PROPERTY_DATA, "is_featured": True},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = Property.objects.get(pk=response.data["id"])
        self.assertFalse(created.is_featured)
        self.assertFalse(created.is_approved)

    def test_agent_rejects_non_positive_price(self):
        self.client.force_authenticate(user=self.agent)

        response = self.client.post(
            "/api/properties/create/",
            {**PROPERTY_DATA, "price": "0"},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("price", response.data)

    def test_agent_cannot_approve_property(self):
        self.client.force_authenticate(user=self.agent)

        response = self.client.patch(
            f"/api/properties/approve/{self.pending.id}/"
        )

        self.pending.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(self.pending.is_approved)


class InquirySecurityTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.owner = make_user("ownerAgent", "AGENT")
        self.other_agent = make_user("otherAgent", "AGENT")
        self.buyer = make_user("buyerOne", "USER")
        self.other_buyer = make_user("buyerTwo", "USER")
        self.property = make_property(self.owner, approved=True)
        self.inquiry = Inquiry.objects.create(
            property=self.property,
            buyer=self.buyer,
            message="Is this available?",
        )

    def respond_url(self):
        return f"/api/inquiries/{self.inquiry.id}/respond/"

    def test_buyer_can_create_inquiry_on_approved_property(self):
        self.client.force_authenticate(user=self.other_buyer)

        response = self.client.post(
            "/api/inquiries/create/",
            {"property": self.property.id, "message": "Hello"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_buyer_list_contains_only_own_inquiries(self):
        self.client.force_authenticate(user=self.other_buyer)

        response = self.client.get("/api/inquiries/my/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

    def test_buyer_cannot_respond_to_inquiry(self):
        self.client.force_authenticate(user=self.buyer)

        response = self.client.patch(
            self.respond_url(), {"response": "Hi"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_other_agent_cannot_respond_to_inquiry(self):
        self.client.force_authenticate(user=self.other_agent)

        response = self.client.patch(
            self.respond_url(), {"response": "Hi"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.inquiry.refresh_from_db()
        self.assertEqual(self.inquiry.response, "")

    def test_owner_agent_can_respond_to_inquiry(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.patch(
            self.respond_url(), {"response": "Yes"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.inquiry.refresh_from_db()
        self.assertEqual(self.inquiry.response, "Yes")

    def test_agent_cannot_inquire_about_own_property(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            "/api/inquiries/create/",
            {"property": self.property.id, "message": "Mine"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class BookmarkSecurityTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.owner = make_user("bookOwner", "AGENT")
        self.user = make_user("bookUser", "USER")
        self.other_user = make_user("bookOther", "USER")
        self.approved = make_property(self.owner, approved=True)
        self.pending = make_property(self.owner, approved=False)

    def test_cannot_bookmark_pending_property(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/bookmarks/add/",
            {"property_id": self.pending.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(
            Bookmark.objects.filter(property=self.pending).exists()
        )

    def test_duplicate_bookmark_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        payload = {"property_id": self.approved.id}

        first = self.client.post("/api/bookmarks/add/", payload, format="json")
        second = self.client.post("/api/bookmarks/add/", payload, format="json")

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_cannot_remove_another_users_bookmark(self):
        bookmark = Bookmark.objects.create(
            user=self.user, property=self.approved
        )
        self.client.force_authenticate(user=self.other_user)

        response = self.client.delete(f"/api/bookmarks/remove/{bookmark.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Bookmark.objects.filter(pk=bookmark.id).exists())

    def test_anonymous_bookmark_is_rejected(self):
        response = self.client.post(
            "/api/bookmarks/add/",
            {"property_id": self.approved.id},
            format="json",
        )

        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
