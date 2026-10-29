from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from properties.models import Property
from .models import Bookmark


class BookmarkTestBase(TestCase):

    def setUp(self):

        self.user = User.objects.create_user(
            username="testuser",
            password="TestPass123!",
            role="USER",
        )

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

        self.property = Property.objects.create(
            title="Test Property",
            description="A test property",
            property_type="FLAT",
            price="5000000",
            bedrooms=2,
            bathrooms=2,
            area_sqft=1000,
            address="Test Address",
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


class AddBookmarkTest(BookmarkTestBase):

    def test_authenticated_user_can_bookmark(self):

        token = self.get_jwt_token("testuser", "TestPass123!")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.post(
            "/api/bookmarks/add/",
            {"property_id": self.property.id},
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_201_CREATED
        )
        self.assertTrue(
            Bookmark.objects.filter(
                user=self.user,
                property=self.property
            ).exists()
        )

    def test_duplicate_bookmark_rejected(self):

        token = self.get_jwt_token("testuser", "TestPass123!")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        self.client.post(
            "/api/bookmarks/add/",
            {"property_id": self.property.id},
            format="json",
        )

        response = self.client.post(
            "/api/bookmarks/add/",
            {"property_id": self.property.id},
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST
        )

    def test_unauthenticated_cannot_bookmark(self):

        response = self.client.post(
            "/api/bookmarks/add/",
            {"property_id": self.property.id},
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_401_UNAUTHORIZED
        )


class BookmarkListTest(BookmarkTestBase):

    def test_list_own_bookmarks(self):

        token = self.get_jwt_token("testuser", "TestPass123!")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        Bookmark.objects.create(
            user=self.user,
            property=self.property
        )

        response = self.client.get(
            "/api/bookmarks/list/"
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
            results[0]["property"]["id"],
            self.property.id
        )


class RemoveBookmarkTest(BookmarkTestBase):

    def test_remove_bookmark(self):

        token = self.get_jwt_token("testuser", "TestPass123!")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        bookmark = Bookmark.objects.create(
            user=self.user,
            property=self.property
        )

        response = self.client.delete(
            f"/api/bookmarks/remove/{bookmark.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_204_NO_CONTENT
        )
        self.assertFalse(
            Bookmark.objects.filter(id=bookmark.id).exists()
        )

    def test_cannot_remove_other_user_bookmark(self):

        other_user = User.objects.create_user(
            username="otheruser",
            password="TestPass123!",
            role="USER",
        )

        bookmark = Bookmark.objects.create(
            user=other_user,
            property=self.property
        )

        token = self.get_jwt_token("testuser", "TestPass123!")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.delete(
            f"/api/bookmarks/remove/{bookmark.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_404_NOT_FOUND
        )


class BookmarkStatusTest(BookmarkTestBase):

    def test_status_false_when_not_bookmarked(self):

        token = self.get_jwt_token("testuser", "TestPass123!")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.get(
            f"/api/bookmarks/status/{self.property.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )
        self.assertFalse(response.data["is_bookmarked"])

    def test_status_true_when_bookmarked(self):

        token = self.get_jwt_token("testuser", "TestPass123!")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        Bookmark.objects.create(
            user=self.user,
            property=self.property
        )

        response = self.client.get(
            f"/api/bookmarks/status/{self.property.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )
        self.assertTrue(response.data["is_bookmarked"])
