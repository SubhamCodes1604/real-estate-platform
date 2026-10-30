from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from properties.models import Property
from .models import Review


class ReviewTestBase(TestCase):

    def setUp(self):

        self.user = User.objects.create_user(
            username="reviewer",
            password="TestPass123!",
            role="USER",
        )

        self.other_user = User.objects.create_user(
            username="otherreviewer",
            password="TestPass123!",
            role="USER",
        )

        self.agent = User.objects.create_user(
            username="owneragent",
            password="TestPass123!",
            role="AGENT",
        )

        self.property = self.create_property(
            title="Approved Property",
            is_approved=True,
        )

        self.client = APIClient()

    def create_property(self, title, is_approved):

        return Property.objects.create(
            title=title,
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
            is_approved=is_approved,
            created_by=self.agent,
        )

    def get_jwt_token(self, username, password):

        response = self.client.post(
            "/api/accounts/login/",
            {"username": username, "password": password},
            format="json",
        )

        return response.data["access"]

    def login_as(self, username):

        token = self.get_jwt_token(username, "TestPass123!")

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    def create_review(self, user, property_obj=None, rating=4, comment="Good"):

        return Review.objects.create(
            property=property_obj or self.property,
            user=user,
            rating=rating,
            comment=comment,
        )


class ReviewCreateTest(ReviewTestBase):

    def test_authenticated_user_creates_review(self):

        self.login_as("reviewer")

        response = self.client.post(
            "/api/reviews/add/",
            {
                "property": self.property.id,
                "rating": 5,
                "comment": "  Excellent place  ",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"], self.user.id)
        self.assertEqual(response.data["user_name"], "reviewer")
        self.assertEqual(response.data["comment"], "Excellent place")

        review = Review.objects.get(property=self.property, user=self.user)
        self.assertEqual(review.rating, 5)

    def test_anonymous_cannot_create_review(self):

        response = self.client.post(
            "/api/reviews/add/",
            {"property": self.property.id, "rating": 5, "comment": "Nice"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(Review.objects.exists())

    def test_client_supplied_user_is_ignored(self):

        self.login_as("reviewer")

        response = self.client.post(
            "/api/reviews/add/",
            {
                "property": self.property.id,
                "user": self.other_user.id,
                "rating": 3,
                "comment": "Fine",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"], self.user.id)

    def test_invalid_ratings_rejected(self):

        self.login_as("reviewer")

        for rating in [0, 6, -1, "abc", 3.5, None]:
            response = self.client.post(
                "/api/reviews/add/",
                {
                    "property": self.property.id,
                    "rating": rating,
                    "comment": "Comment",
                },
                format="json",
            )

            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST,
                msg=f"rating={rating!r} should be rejected",
            )

        self.assertFalse(Review.objects.exists())

    def test_blank_comment_rejected(self):

        self.login_as("reviewer")

        for comment in ["", "   \n\t  "]:
            response = self.client.post(
                "/api/reviews/add/",
                {
                    "property": self.property.id,
                    "rating": 4,
                    "comment": comment,
                },
                format="json",
            )

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("comment", response.data)

        self.assertFalse(Review.objects.exists())

    def test_missing_property_rejected(self):

        self.login_as("reviewer")

        response = self.client.post(
            "/api/reviews/add/",
            {"rating": 4, "comment": "Comment"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("property", response.data)

    def test_unapproved_property_rejected(self):

        pending = self.create_property(title="Pending", is_approved=False)

        self.login_as("reviewer")

        response = self.client.post(
            "/api/reviews/add/",
            {"property": pending.id, "rating": 4, "comment": "Comment"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Review.objects.filter(property=pending).exists())

    def test_owner_cannot_review_own_property(self):

        self.login_as("owneragent")

        response = self.client.post(
            "/api/reviews/add/",
            {"property": self.property.id, "rating": 5, "comment": "Mine"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Review.objects.exists())

    def test_duplicate_review_rejected(self):

        self.create_review(self.user)

        self.login_as("reviewer")

        response = self.client.post(
            "/api/reviews/add/",
            {"property": self.property.id, "rating": 2, "comment": "Again"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            Review.objects.filter(property=self.property, user=self.user).count(),
            1,
        )

    def test_same_user_can_review_different_property(self):

        second = self.create_property(title="Second", is_approved=True)
        self.create_review(self.user)

        self.login_as("reviewer")

        response = self.client.post(
            "/api/reviews/add/",
            {"property": second.id, "rating": 4, "comment": "Also good"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class ReviewEditDeleteTest(ReviewTestBase):

    def test_owner_can_patch_rating_and_comment(self):

        review = self.create_review(self.user)

        self.login_as("reviewer")

        response = self.client.patch(
            f"/api/reviews/{review.id}/",
            {"rating": 2, "comment": "Changed my mind"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["rating"], 2)
        review.refresh_from_db()
        self.assertEqual(review.rating, 2)
        self.assertEqual(review.comment, "Changed my mind")

    def test_owner_can_put_full_update(self):

        review = self.create_review(self.user)

        self.login_as("reviewer")

        response = self.client.put(
            f"/api/reviews/{review.id}/",
            {"rating": 5, "comment": "Full update"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        review.refresh_from_db()
        self.assertEqual(review.rating, 5)

    def test_edit_cannot_change_property(self):

        review = self.create_review(self.user)
        second = self.create_property(title="Second", is_approved=True)

        self.login_as("reviewer")

        response = self.client.patch(
            f"/api/reviews/{review.id}/",
            {"property": second.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        review.refresh_from_db()
        self.assertEqual(review.property_id, self.property.id)

    def test_edit_rejects_invalid_rating_and_blank_comment(self):

        review = self.create_review(self.user)

        self.login_as("reviewer")

        response = self.client.patch(
            f"/api/reviews/{review.id}/",
            {"rating": 9},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.patch(
            f"/api/reviews/{review.id}/",
            {"comment": "   "},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        review.refresh_from_db()
        self.assertEqual(review.rating, 4)
        self.assertEqual(review.comment, "Good")

    def test_owner_can_delete_review(self):

        review = self.create_review(self.user)

        self.login_as("reviewer")

        response = self.client.delete(f"/api/reviews/{review.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Review.objects.filter(id=review.id).exists())

    def test_other_user_cannot_edit_or_delete(self):

        review = self.create_review(self.other_user)

        self.login_as("reviewer")

        response = self.client.patch(
            f"/api/reviews/{review.id}/",
            {"rating": 1},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        response = self.client.delete(f"/api/reviews/{review.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        review.refresh_from_db()
        self.assertEqual(review.rating, 4)

    def test_missing_review_id_returns_404(self):

        self.login_as("reviewer")

        response = self.client.patch(
            "/api/reviews/999999/",
            {"rating": 3},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        response = self.client.delete("/api/reviews/999999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_anonymous_cannot_edit_or_delete(self):

        review = self.create_review(self.user)

        response = self.client.patch(
            f"/api/reviews/{review.id}/",
            {"rating": 1},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.delete(f"/api/reviews/{review.id}/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.assertTrue(Review.objects.filter(id=review.id).exists())


class PropertyReviewReadTest(ReviewTestBase):

    def test_anonymous_can_list_reviews_newest_first_paginated(self):

        first = self.create_review(self.user, comment="First")
        second = self.create_review(self.other_user, comment="Second")

        response = self.client.get(
            f"/api/reviews/property/{self.property.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            set(response.data.keys()),
            {"count", "next", "previous", "results"},
        )
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(
            [item["id"] for item in response.data["results"]],
            [second.id, first.id],
        )

    def test_list_only_includes_this_property(self):

        other_property = self.create_property(title="Other", is_approved=True)
        self.create_review(self.user)
        self.create_review(self.other_user, property_obj=other_property)

        response = self.client.get(
            f"/api/reviews/property/{self.property.id}/"
        )

        self.assertEqual(response.data["count"], 1)

    def test_empty_property_returns_empty_list(self):

        response = self.client.get(
            f"/api/reviews/property/{self.property.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(response.data["results"], [])

    def test_unapproved_property_reviews_hidden(self):

        pending = self.create_property(title="Pending", is_approved=False)
        self.create_review(self.user, property_obj=pending)

        list_response = self.client.get(
            f"/api/reviews/property/{pending.id}/"
        )
        average_response = self.client.get(
            f"/api/reviews/property/{pending.id}/average/"
        )
        summary_response = self.client.get(
            f"/api/reviews/property/{pending.id}/summary/"
        )

        self.assertEqual(list_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(average_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(summary_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_recent_feed_excludes_unapproved_properties(self):

        pending = self.create_property(title="Pending", is_approved=False)
        visible = self.create_review(self.user, comment="Visible")
        self.create_review(self.other_user, property_obj=pending)

        response = self.client.get("/api/reviews/recent/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], visible.id)

    def test_summary_average_count_and_distribution(self):

        self.create_review(self.user, rating=5)
        self.create_review(self.other_user, rating=3)

        response = self.client.get(
            f"/api/reviews/property/{self.property.id}/summary/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["average_rating"], 4.0)
        self.assertEqual(response.data["total_reviews"], 2)
        self.assertEqual(
            response.data["distribution"],
            {"1": 0, "2": 0, "3": 1, "4": 0, "5": 1},
        )

    def test_summary_empty_property(self):

        response = self.client.get(
            f"/api/reviews/property/{self.property.id}/summary/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["average_rating"])
        self.assertEqual(response.data["total_reviews"], 0)
        self.assertEqual(
            response.data["distribution"],
            {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0},
        )

    def test_average_endpoint_calculates_mean(self):

        self.create_review(self.user, rating=2)
        self.create_review(self.other_user, rating=4)

        response = self.client.get(
            f"/api/reviews/property/{self.property.id}/average/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["average"], 3.0)
