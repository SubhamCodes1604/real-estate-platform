from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from .models import Answer, AnswerVote, Question


class CommunityTestBase(TestCase):

    def setUp(self):

        self.user = User.objects.create_user(
            username="testuser",
            password="TestPass123!",
            role="USER",
        )

        self.user2 = User.objects.create_user(
            username="testuser2",
            password="TestPass123!",
            role="AGENT",
        )

        self.question = Question.objects.create(
            author=self.user,
            title="What is the best area in Mumbai?",
            body="Looking for a 2BHK under 50 lakh.",
        )

        self.answer = Answer.objects.create(
            question=self.question,
            author=self.user2,
            body="Andheri is a great area within that budget.",
            is_ai_generated=False,
        )

        self.ai_answer = Answer.objects.create(
            question=self.question,
            author=None,
            body="Based on platform data, Andheri West has options.",
            is_ai_generated=True,
        )

        self.client = APIClient()

    def get_jwt_token(self, username, password):

        response = self.client.post(
            "/api/accounts/login/",
            {"username": username, "password": password},
            format="json",
        )

        return response.data["access"]


class QuestionListCreateTest(CommunityTestBase):

    def test_list_questions_anonymous(self):

        response = self.client.get(
            "/api/community/questions/"
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
            results[0]["title"], "What is the best area in Mumbai?"
        )

    def test_list_questions_includes_answers_count(self):

        response = self.client.get(
            "/api/community/questions/"
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        self.assertEqual(
            results[0]["answers_count"], 1
        )
        self.assertFalse(
            results[0]["has_accepted_answer"]
        )

    def test_list_questions_excludes_ai_answers_from_count(self):

        response = self.client.get(
            "/api/community/questions/"
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        self.assertEqual(results[0]["answers_count"], 1)

    def test_create_question_authenticated(self):

        token = self.get_jwt_token(
            "testuser", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.post(
            "/api/community/questions/",
            {
                "title": "How to verify property documents?",
                "body": "What documents should I check?",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_201_CREATED
        )
        self.assertEqual(
            response.data["title"],
            "How to verify property documents?",
        )
        self.assertEqual(
            response.data["author_username"], "testuser"
        )

    def test_create_question_unauthenticated(self):

        response = self.client.post(
            "/api/community/questions/",
            {"title": "Test", "body": "Test"},
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_search_questions(self):

        Question.objects.create(
            author=self.user,
            title="Pune property rates",
            body="What are current rates?",
        )

        response = self.client.get(
            "/api/community/questions/?search=Pune"
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        self.assertEqual(len(results), 1)
        self.assertEqual(
            results[0]["title"], "Pune property rates"
        )


class QuestionDetailTest(CommunityTestBase):

    def test_retrieve_question(self):

        response = self.client.get(
            f"/api/community/questions/{self.question.id}/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )
        self.assertEqual(
            response.data["title"],
            "What is the best area in Mumbai?",
        )

    def test_detail_excludes_ai_answers_from_answers_field(self):

        response = self.client.get(
            f"/api/community/questions/{self.question.id}/"
        )

        answers = response.data.get("answers", [])

        for ans in answers:
            self.assertFalse(ans["is_ai_generated"])

        self.assertEqual(len(answers), 1)
        self.assertEqual(
            answers[0]["body"],
            "Andheri is a great area within that budget.",
        )

    def test_detail_includes_answers_count(self):

        response = self.client.get(
            f"/api/community/questions/{self.question.id}/"
        )

        self.assertEqual(
            response.data["answers_count"], 1
        )

    def test_detail_nonexistent_returns_404(self):

        response = self.client.get(
            "/api/community/questions/99999/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_404_NOT_FOUND
        )


class AnswerCreateTest(CommunityTestBase):

    def test_list_answers_excludes_ai(self):

        response = self.client.get(
            f"/api/community/questions/{self.question.id}/answers/"
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        self.assertEqual(len(results), 1)
        self.assertFalse(results[0]["is_ai_generated"])

    def test_create_answer_authenticated(self):

        token = self.get_jwt_token(
            "testuser", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.post(
            f"/api/community/questions/{self.question.id}/answers/",
            {"body": "Try Bandra area."},
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_201_CREATED
        )
        self.assertFalse(response.data["is_ai_generated"])
        self.assertEqual(
            response.data["author_username"], "testuser"
        )
        self.assertEqual(
            response.data["author_role"], "USER"
        )

    def test_create_answer_unauthenticated(self):

        response = self.client.post(
            f"/api/community/questions/{self.question.id}/answers/",
            {"body": "Test"},
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_answer_includes_author_role(self):

        token = self.get_jwt_token(
            "testuser2", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        self.client.post(
            f"/api/community/questions/{self.question.id}/answers/",
            {"body": "Another answer."},
            format="json",
        )

        response = self.client.get(
            f"/api/community/questions/{self.question.id}/answers/"
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        for ans in results:
            if ans["author_username"] == "testuser2":
                self.assertEqual(
                    ans["author_role"], "AGENT"
                )
                return

        self.fail("Answer by testuser2 not found")

    def test_ai_answer_author_role_is_none(self):

        response = self.client.get(
            f"/api/community/questions/{self.question.id}/answers/"
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        for ans in results:
            if ans["is_ai_generated"]:
                self.assertIsNone(ans["author_role"])
                return

        self.assertEqual(len(results), 1)


class AnswerVoteTest(CommunityTestBase):

    def test_like_answer(self):

        token = self.get_jwt_token(
            "testuser", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.post(
            f"/api/community/answers/{self.answer.id}/like/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )
        self.assertEqual(response.data["likes"], 1)
        self.assertEqual(response.data["dislikes"], 0)
        self.assertEqual(
            response.data["user_vote"], "LIKE"
        )

    def test_dislike_answer(self):

        token = self.get_jwt_token(
            "testuser", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.post(
            f"/api/community/answers/{self.answer.id}/dislike/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )
        self.assertEqual(response.data["likes"], 0)
        self.assertEqual(response.data["dislikes"], 1)
        self.assertEqual(
            response.data["user_vote"], "DISLIKE"
        )

    def test_toggle_like_removes_vote(self):

        token = self.get_jwt_token(
            "testuser", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        self.client.post(
            f"/api/community/answers/{self.answer.id}/like/"
        )

        response = self.client.post(
            f"/api/community/answers/{self.answer.id}/like/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )
        self.assertEqual(response.data["likes"], 0)
        self.assertIsNone(response.data["user_vote"])

    def test_switch_like_to_dislike(self):

        token = self.get_jwt_token(
            "testuser", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        self.client.post(
            f"/api/community/answers/{self.answer.id}/like/"
        )

        response = self.client.post(
            f"/api/community/answers/{self.answer.id}/dislike/"
        )

        self.assertEqual(response.data["likes"], 0)
        self.assertEqual(response.data["dislikes"], 1)
        self.assertEqual(
            response.data["user_vote"], "DISLIKE"
        )

    def test_vote_unauthenticated(self):

        response = self.client.post(
            f"/api/community/answers/{self.answer.id}/like/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_vote_on_ai_answer(self):

        token = self.get_jwt_token(
            "testuser", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.post(
            f"/api/community/answers/{self.ai_answer.id}/like/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )
        self.assertEqual(response.data["likes"], 1)
        self.assertEqual(
            response.data["user_vote"], "LIKE"
        )

    def test_invalid_vote_type(self):

        token = self.get_jwt_token(
            "testuser", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.post(
            f"/api/community/answers/{self.answer.id}/invalid/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_404_NOT_FOUND
        )


class AcceptAnswerTest(CommunityTestBase):

    def test_owner_can_accept(self):

        token = self.get_jwt_token(
            "testuser", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.post(
            f"/api/community/answers/{self.answer.id}/accept/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK
        )
        self.answer.refresh_from_db()
        self.assertTrue(self.answer.is_accepted)

    def test_non_owner_cannot_accept(self):

        token = self.get_jwt_token(
            "testuser2", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.post(
            f"/api/community/answers/{self.answer.id}/accept/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_403_FORBIDDEN
        )
        self.answer.refresh_from_db()
        self.assertFalse(self.answer.is_accepted)

    def test_cannot_accept_ai_answer(self):

        token = self.get_jwt_token(
            "testuser", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.post(
            f"/api/community/answers/{self.ai_answer.id}/accept/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST
        )

    def test_accept_unauthenticated(self):

        response = self.client.post(
            f"/api/community/answers/{self.answer.id}/accept/"
        )

        self.assertEqual(
            response.status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_accepting_new_answer_unsets_previous(self):

        token = self.get_jwt_token(
            "testuser", "TestPass123!"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        self.client.post(
            f"/api/community/answers/{self.answer.id}/accept/"
        )

        answer2 = Answer.objects.create(
            question=self.question,
            author=self.user2,
            body="Another suggestion.",
            is_ai_generated=False,
        )

        self.client.post(
            f"/api/community/answers/{answer2.id}/accept/"
        )

        self.answer.refresh_from_db()
        answer2.refresh_from_db()
        self.assertFalse(self.answer.is_accepted)
        self.assertTrue(answer2.is_accepted)


class HasAcceptedAnswerTest(CommunityTestBase):

    def test_has_accepted_answer_false(self):

        response = self.client.get(
            "/api/community/questions/"
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        self.assertFalse(
            results[0]["has_accepted_answer"]
        )

    def test_has_accepted_answer_true(self):

        self.answer.is_accepted = True
        self.answer.save()

        response = self.client.get(
            "/api/community/questions/"
        )

        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )

        self.assertTrue(
            results[0]["has_accepted_answer"]
        )
