
from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from properties.models import Property
from reviews.models import Review


User = get_user_model()


class ReviewAPITests(APITestCase):

    @classmethod
    def setUpTestData(cls):

        # Normal users
        cls.user1 = User.objects.create_user(
            username="reviewuser1",
            password="TestPass123!",
            role="USER"
        )

        cls.user2 = User.objects.create_user(
            username="reviewuser2",
            password="TestPass123!",
            role="USER"
        )

        # Agent / property owner
        cls.agent = User.objects.create_user(
            username="propertyagent",
            password="TestPass123!",
            role="AGENT"
        )

        # Approved property
        cls.property = Property.objects.create(
            title="Test Apartment",
            description="Test property description",
            property_type="FLAT",
            price="5000000.00",
            bedrooms=2,
            bathrooms=2,
            area_sqft=1200,
            address="Test Address",
            city="Kolkata",
            state="West Bengal",
            pincode="700001",
            is_approved=True,
            created_by=cls.agent
        )

        # Unapproved property
        cls.unapproved_property = Property.objects.create(
            title="Unapproved Apartment",
            description="Unapproved property",
            property_type="FLAT",
            price="4000000.00",
            bedrooms=2,
            bathrooms=1,
            area_sqft=1000,
            address="Another Test Address",
            city="Kolkata",
            state="West Bengal",
            pincode="700002",
            is_approved=False,
            created_by=cls.agent
        )

    def setUp(self):

        self.add_review_url = reverse("add-review")

        self.review_list_url = reverse(
            "property-reviews",
            kwargs={"property_id": self.property.id}
        )

        self.average_url = reverse(
            "property-average-rating",
            kwargs={"property_id": self.property.id}
        )

        self.my_review_url = reverse(
            "my-property-review",
            kwargs={"property_id": self.property.id}
        )

    # --------------------------------
    # CREATE REVIEW
    # --------------------------------

    def test_authenticated_user_can_create_review(self):

        self.client.force_authenticate(user=self.user1)

        response = self.client.post(
            self.add_review_url,
            {
                "property": self.property.id,
                "rating": 5,
                "comment": "Excellent property!"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        self.assertTrue(
            Review.objects.filter(
                property=self.property,
                user=self.user1
            ).exists()
        )

    def test_unauthenticated_user_cannot_create_review(self):

        response = self.client.post(
            self.add_review_url,
            {
                "property": self.property.id,
                "rating": 5,
                "comment": "Excellent property!"
            },
            format="json"
        )

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN
            ]
        )

    def test_user_cannot_review_own_property(self):

        self.client.force_authenticate(user=self.agent)

        response = self.client.post(
            self.add_review_url,
            {
                "property": self.property.id,
                "rating": 4,
                "comment": "My own property"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_user_cannot_review_unapproved_property(self):

        self.client.force_authenticate(user=self.user1)

        response = self.client.post(
            self.add_review_url,
            {
                "property": self.unapproved_property.id,
                "rating": 4,
                "comment": "Test review"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_duplicate_review_is_rejected(self):

        Review.objects.create(
            property=self.property,
            user=self.user1,
            rating=4,
            comment="Original review"
        )

        self.client.force_authenticate(user=self.user1)

        response = self.client.post(
            self.add_review_url,
            {
                "property": self.property.id,
                "rating": 5,
                "comment": "Duplicate review"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------
    # RATING VALIDATION
    # --------------------------------

    def test_rating_below_one_is_rejected(self):

        self.client.force_authenticate(user=self.user1)

        response = self.client.post(
            self.add_review_url,
            {
                "property": self.property.id,
                "rating": 0,
                "comment": "Invalid rating"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_rating_above_five_is_rejected(self):

        self.client.force_authenticate(user=self.user1)

        response = self.client.post(
            self.add_review_url,
            {
                "property": self.property.id,
                "rating": 6,
                "comment": "Invalid rating"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_empty_comment_is_rejected(self):

        self.client.force_authenticate(user=self.user1)

        response = self.client.post(
            self.add_review_url,
            {
                "property": self.property.id,
                "rating": 4,
                "comment": "   "
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------
    # EDIT AND DELETE REVIEW
    # --------------------------------

    def test_user_can_edit_own_review(self):

        review = Review.objects.create(
            property=self.property,
            user=self.user1,
            rating=3,
            comment="Original comment"
        )

        self.client.force_authenticate(user=self.user1)

        response = self.client.patch(
            reverse(
                "review-detail",
                kwargs={"pk": review.id}
            ),
            {
                "rating": 5,
                "comment": "Updated comment"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        review.refresh_from_db()

        self.assertEqual(review.rating, 5)
        self.assertEqual(review.comment, "Updated comment")

    def test_user_cannot_edit_another_users_review(self):

        review = Review.objects.create(
            property=self.property,
            user=self.user1,
            rating=3,
            comment="Original comment"
        )

        self.client.force_authenticate(user=self.user2)

        response = self.client.patch(
            reverse(
                "review-detail",
                kwargs={"pk": review.id}
            ),
            {
                "rating": 5,
                "comment": "Unauthorized edit"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_user_can_delete_own_review(self):

        review = Review.objects.create(
            property=self.property,
            user=self.user1,
            rating=4,
            comment="Review to delete"
        )

        self.client.force_authenticate(user=self.user1)

        response = self.client.delete(
            reverse(
                "review-detail",
                kwargs={"pk": review.id}
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertFalse(
            Review.objects.filter(pk=review.id).exists()
        )

    def test_user_cannot_delete_another_users_review(self):

        review = Review.objects.create(
            property=self.property,
            user=self.user1,
            rating=4,
            comment="Protected review"
        )

        self.client.force_authenticate(user=self.user2)

        response = self.client.delete(
            reverse(
                "review-detail",
                kwargs={"pk": review.id}
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

        self.assertTrue(
            Review.objects.filter(pk=review.id).exists()
        )

    # --------------------------------
    # REVIEW LIST AND RATING SUMMARY
    # --------------------------------

    def test_approved_property_reviews_are_visible(self):

        Review.objects.create(
            property=self.property,
            user=self.user1,
            rating=5,
            comment="Excellent"
        )

        response = self.client.get(self.review_list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

    def test_unapproved_property_reviews_are_not_visible(self):

        Review.objects.create(
            property=self.unapproved_property,
            user=self.user1,
            rating=5,
            comment="Existing review"
        )

        response = self.client.get(
            reverse(
                "property-reviews",
                kwargs={
                    "property_id": self.unapproved_property.id
                }
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        self.assertEqual(len(results), 0)

    def test_average_rating_is_calculated_correctly(self):

        Review.objects.create(
            property=self.property,
            user=self.user1,
            rating=5,
            comment="Excellent"
        )

        Review.objects.create(
            property=self.property,
            user=self.user2,
            rating=3,
            comment="Good"
        )

        response = self.client.get(self.average_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(response.data["average"], 4.0)
        self.assertEqual(response.data["total_reviews"], 2)

    def test_rating_distribution_is_correct(self):

        Review.objects.create(
            property=self.property,
            user=self.user1,
            rating=5,
            comment="Excellent"
        )

        Review.objects.create(
            property=self.property,
            user=self.user2,
            rating=3,
            comment="Good"
        )

        response = self.client.get(self.average_url)

        self.assertEqual(response.data["distribution"]["5"], 1)
        self.assertEqual(response.data["distribution"]["3"], 1)
        self.assertEqual(response.data["distribution"]["1"], 0)

    def test_unapproved_property_has_zero_rating_summary(self):

        response = self.client.get(
            reverse(
                "property-average-rating",
                kwargs={
                    "property_id": self.unapproved_property.id
                }
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["approved"])
        self.assertEqual(response.data["total_reviews"], 0)

    # --------------------------------
    # CURRENT USER REVIEW
    # --------------------------------

    def test_user_can_retrieve_own_property_review(self):

        review = Review.objects.create(
            property=self.property,
            user=self.user1,
            rating=5,
            comment="My review"
        )

        self.client.force_authenticate(user=self.user1)

        response = self.client.get(self.my_review_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["review"]["id"], review.id)
        self.assertFalse(response.data["is_owner"])

    def test_property_owner_status_is_returned(self):

        self.client.force_authenticate(user=self.agent)

        response = self.client.get(self.my_review_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_owner"])
