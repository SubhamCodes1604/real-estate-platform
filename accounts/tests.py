from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import User


class AuthTestBase(TestCase):

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

        self.client = APIClient()

    def get_jwt_token(self, username, password):

        response = self.client.post(
            "/api/accounts/login/",
            {"username": username, "password": password},
            format="json",
        )

        return response.data["access"]


class RegisterTest(AuthTestBase):

    def test_register_user(self):

        response = self.client.post(
            "/api/accounts/register/",
            {
                "username": "newuser",
                "email": "newuser@test.com",
                "password": "NewPass123!",
                "role": "USER",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(response.data["role"], "USER")

    def test_register_agent(self):

        response = self.client.post(
            "/api/accounts/register/",
            {
                "username": "newagent",
                "email": "newagent@test.com",
                "password": "NewPass123!",
                "role": "AGENT",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(response.data["role"], "AGENT")

    def test_register_admin_rejected(self):

        response = self.client.post(
            "/api/accounts/register/",
            {
                "username": "newadmin",
                "email": "newadmin@test.com",
                "password": "NewPass123!",
                "role": "ADMIN",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )


class LoginTest(AuthTestBase):

    def test_login_success(self):

        response = self.client.post(
            "/api/accounts/login/",
            {
                "username": "testuser",
                "password": "TestPass123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_wrong_password(self):

        response = self.client.post(
            "/api/accounts/login/",
            {
                "username": "testuser",
                "password": "wrong",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_login_nonexistent_user(self):

        response = self.client.post(
            "/api/accounts/login/",
            {
                "username": "ghost",
                "password": "TestPass123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )


class ProfileTest(AuthTestBase):

    def test_profile_authenticated(self):

        token = self.get_jwt_token("testuser", "TestPass123!")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.get(
            "/api/accounts/profile/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["username"], "testuser"
        )
        self.assertEqual(response.data["role"], "USER")

    def test_profile_unauthenticated(self):

        response = self.client.get(
            "/api/accounts/profile/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )


class TokenRefreshTest(AuthTestBase):

    def test_token_refresh(self):

        login = self.client.post(
            "/api/accounts/login/",
            {
                "username": "testuser",
                "password": "TestPass123!",
            },
            format="json",
        )

        refresh_token = login.data["refresh"]

        response = self.client.post(
            "/api/accounts/token/refresh/",
            {"refresh": refresh_token},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertIn("access", response.data)
