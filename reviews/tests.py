from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from properties.models import Property
from .models import Review


class ReviewTestBase(TestCase):

    def setUp(self):

        self.owner = User.objects.create_user(
            username="owner",
            password="TestPass123!",
            role="AGENT",
        )

        self.reviewer = User.objects.create_user(
            username="reviewer",
            password="TestPass123!",
            role="USER",
        )

        self.other_user = User.objects.create_user(
            username="otheruser",
            password="TestPass123!",
            role="USER",
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
            created_by=self.owner,
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
            created_by=self.owner,
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

    def create_review(
        self,
        user,
        property_obj,
        rating=5,
        comment="Great place.",
    ):

        return Review.objects.create(
            property=property_obj,
            user=user,
            rating=rating,
            comment=comment,
        )


class ReviewCreateTest(ReviewTestBase):

    def test_create_review_authenticated(self):

        self.auth_as("reviewer", "TestPass123!")

        response = self.client.post(
            "/api/reviews/add/",
            {
                "property": self.approved_property.id,
                "rating": 4,
                "comment": "Lovely home.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_201_CREATED
        )

        self.assertEqual(response.data["rating"], 4)
        self.assertEqual(
            response.data["comment"], "Lovely home."
        )
        self.assertEqual(
            response.data["user_username"], "reviewer"
        )

    def test_create_review_unauthenticated(self):

        response = self.client.post(
            "/api/reviews/add/",
            {
                "property": self.approved_property.id,
                "rating": 4,
                "comment": "Lovely home.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_owner_cannot_review_own_property(self):

        self.auth_as("owner", "TestPass123!")

        response = self.client.post(
            "/api/reviews/add/",
            {
                "property": self.approved_property.id,
                "rating": 5,
                "comment": "My property.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_403_FORBIDDEN
        )

    def test_cannot_review_unapproved_property(self):

        self.auth_as("reviewer", "TestPass123!")

        response = self.client.post(
            "/api/reviews/add/",
            {
                "property": self.unapproved_property.id,
                "rating": 5,
                "comment": "Nice.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_403_FORBIDDEN
        )

    def test_duplicate_review_prevented(self):

        self.create_review(self.reviewer, self.approved_property)

        self.auth_as("reviewer", "TestPass123!")

        response = self.client.post(
            "/api/reviews/add/",
            {
                "property": self.approved_property.id,
                "rating": 3,
                "comment": "Second review.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_invalid_rating_below_range(self):

        self.auth_as("reviewer", "TestPass123!")

        response = self.client.post(
            "/api/reviews/add/",
            {
                "property": self.approved_property.id,
                "rating": 0,
                "comment": "Bad.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_invalid_rating_above_range(self):

        self.auth_as("reviewer", "TestPass123!")

        response = self.client.post(
            "/api/reviews/add/",
            {
                "property": self.approved_property.id,
                "rating": 6,
                "comment": "Too high.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_empty_comment_rejected(self):

        self.auth_as("reviewer", "TestPass123!")

        response = self.client.post(
            "/api/reviews/add/",
            {
                "property": self.approved_property.id,
                "rating": 5,
                "comment": "   ",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_missing_property_rejected(self):

        self.auth_as("reviewer", "TestPass123!")

        response = self.client.post(
            "/api/reviews/add/",
            {
                "rating": 5,
                "comment": "No property.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_user_derived_from_request(self):

        self.auth_as("reviewer", "TestPass123!")

        response = self.client.post(
            "/api/reviews/add/",
            {
                "property": self.approved_property.id,
                "rating": 5,
                "comment": "Test.",
                "user": self.owner.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_201_CREATED
        )

        review = Review.objects.get(id=response.data["id"])

        self.assertEqual(review.user_id, self.reviewer.id)


class ReviewListTest(ReviewTestBase):

    def test_list_reviews_newest_first(self):

        first = self.create_review(
            self.reviewer,
            self.approved_property,
            comment="First review.",
        )

        second = self.create_review(
            self.other_user,
            self.approved_property,
            comment="Second review.",
        )

        response = self.client.get(
            f"/api/reviews/property/"
            f"{self.approved_property.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
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

    def test_list_reviews_empty(self):

        response = self.client.get(
            f"/api/reviews/property/"
            f"{self.approved_property.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        self.assertEqual(len(results), 0)

    def test_reviews_excluded_for_unapproved_property(self):

        self.create_review(
            self.reviewer,
            self.unapproved_property,
        )

        response = self.client.get(
            f"/api/reviews/property/"
            f"{self.unapproved_property.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        self.assertEqual(len(results), 0)

    def test_property_isolation(self):

        self.create_review(
            self.reviewer,
            self.approved_property,
        )

        other_property = Property.objects.create(
            title="Other Approved",
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
            created_by=self.owner,
        )

        self.create_review(
            self.other_user,
            other_property,
            comment="Other property review.",
        )

        response = self.client.get(
            f"/api/reviews/property/"
            f"{self.approved_property.id}/"
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        self.assertEqual(len(results), 1)

        self.assertEqual(
            results[0]["comment"], "Great place."
        )

    def test_pagination_shape(self):

        for i in range(3):

            self.create_review(
                self.reviewer
                if i == 0
                else self.other_user,
                self.approved_property,
                comment=f"Review {i}",
            )

        response = self.client.get(
            f"/api/reviews/property/"
            f"{self.approved_property.id}/"
        )

        self.assertIn("count", response.data)
        self.assertIn("results", response.data)


class AverageRatingTest(ReviewTestBase):

    def test_average_and_count(self):

        self.create_review(
            self.reviewer,
            self.approved_property,
            rating=4,
        )

        self.create_review(
            self.other_user,
            self.approved_property,
            rating=2,
        )

        response = self.client.get(
            f"/api/reviews/property/"
            f"{self.approved_property.id}/average/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )

        self.assertEqual(response.data["average"], 3.0)
        self.assertEqual(
            response.data["total_reviews"], 2
        )

    def test_distribution(self):

        self.create_review(
            self.reviewer,
            self.approved_property,
            rating=5,
        )

        self.create_review(
            self.other_user,
            self.approved_property,
            rating=3,
        )

        response = self.client.get(
            f"/api/reviews/property/"
            f"{self.approved_property.id}/average/"
        )

        dist = response.data["distribution"]

        self.assertEqual(dist["5"], 1)
        self.assertEqual(dist["3"], 1)
        self.assertEqual(dist["1"], 0)

    def test_average_empty(self):

        response = self.client.get(
            f"/api/reviews/property/"
            f"{self.approved_property.id}/average/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )

        self.assertEqual(response.data["total_reviews"], 0)

    def test_average_unapproved_returns_zero(self):

        response = self.client.get(
            f"/api/reviews/property/"
            f"{self.unapproved_property.id}/average/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )

        self.assertEqual(response.data["total_reviews"], 0)
        self.assertFalse(response.data["approved"])


class ReviewEditDeleteTest(ReviewTestBase):

    def test_owner_can_edit(self):

        review = self.create_review(
            self.reviewer, self.approved_property
        )

        self.auth_as("reviewer", "TestPass123!")

        response = self.client.patch(
            f"/api/reviews/{review.id}/",
            {
                "rating": 2,
                "comment": "Changed my mind.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )

        review.refresh_from_db()

        self.assertEqual(review.rating, 2)
        self.assertEqual(
            review.comment, "Changed my mind."
        )

    def test_non_owner_cannot_edit(self):

        review = self.create_review(
            self.reviewer, self.approved_property
        )

        self.auth_as("otheruser", "TestPass123!")

        response = self.client.patch(
            f"/api/reviews/{review.id}/",
            {
                "rating": 1,
                "comment": "Hacked.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_403_FORBIDDEN
        )

    def test_owner_can_delete(self):

        review = self.create_review(
            self.reviewer, self.approved_property
        )

        self.auth_as("reviewer", "TestPass123!")

        response = self.client.delete(
            f"/api/reviews/{review.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )

        self.assertFalse(
            Review.objects.filter(id=review.id).exists()
        )

    def test_non_owner_cannot_delete(self):

        review = self.create_review(
            self.reviewer, self.approved_property
        )

        self.auth_as("otheruser", "TestPass123!")

        response = self.client.delete(
            f"/api/reviews/{review.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_403_FORBIDDEN
        )

        self.assertTrue(
            Review.objects.filter(id=review.id).exists()
        )

    def test_edit_unauthenticated(self):

        review = self.create_review(
            self.reviewer, self.approved_property
        )

        response = self.client.patch(
            f"/api/reviews/{review.id}/",
            {"rating": 2, "comment": "No auth."},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_delete_unauthenticated(self):

        review = self.create_review(
            self.reviewer, self.approved_property
        )

        response = self.client.delete(
            f"/api/reviews/{review.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_edit_missing_review_404(self):

        self.auth_as("reviewer", "TestPass123!")

        response = self.client.patch(
            "/api/reviews/99999/",
            {"rating": 2, "comment": "Nope."},
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_404_NOT_FOUND
        )

    def test_delete_missing_review_404(self):

        self.auth_as("reviewer", "TestPass123!")

        response = self.client.delete(
            "/api/reviews/99999/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_404_NOT_FOUND
        )

    def test_property_not_changeable_on_edit(self):

        review = self.create_review(
            self.reviewer, self.approved_property
        )

        self.auth_as("reviewer", "TestPass123!")

        response = self.client.patch(
            f"/api/reviews/{review.id}/",
            {
                "property": self.unapproved_property.id,
                "rating": 3,
                "comment": "Move it.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        review.refresh_from_db()

        self.assertEqual(
            review.property_id,
            self.approved_property.id,
        )


class RecentReviewTest(ReviewTestBase):

    def test_recent_excludes_unapproved(self):

        self.create_review(
            self.reviewer, self.approved_property
        )

        self.create_review(
            self.other_user,
            self.unapproved_property,
            comment="Hidden review.",
        )

        response = self.client.get(
            "/api/reviews/recent/"
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        for r in results:

            self.assertNotEqual(
                r["comment"], "Hidden review."
            )
