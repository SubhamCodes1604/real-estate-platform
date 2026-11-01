import io
import os
import zipfile
import tempfile

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from properties.models import Property
from .models import BulkUpload, PropertyImage


def create_valid_image_bytes(fmt="JPEG", size=(100, 100)):
    """Create a real valid image file in memory."""
    from PIL import Image as PILImage
    img = PILImage.new("RGB", size, color="blue")
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def create_excel_bytes(rows, headers=None):
    """Create an Excel file in memory with the given rows."""
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Properties"
    if headers is None:
        headers = [
            "Property ID", "Title", "Description", "Property Type",
            "Price", "Bedrooms", "Bathrooms", "Area (sqft)",
            "Address", "City", "State", "Pincode",
            "Latitude", "Longitude",
        ]
    ws.append(headers)
    for row in rows:
        ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def create_zip_bytes(excel_rows, images_dict, headers=None):
    """Create a ZIP file in memory with properties.xlsx and images/ folder."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("properties.xlsx", create_excel_bytes(excel_rows, headers))
        for folder, images in images_dict.items():
            for idx, img_data in enumerate(images):
                ext = ".jpg" if img_data[:2] == b"\xff\xd8" else ".png"
                zf.writestr(f"images/{folder}/image{idx}{ext}", img_data)
    return buf.getvalue()


def make_valid_row(prop_id="PROP001"):
    return [
        prop_id, "Test Property", "A nice property", "FLAT",
        "5000000", "2", "2", "1000",
        "123 Main St", "Mumbai", "Maharashtra", "400001",
        "19.0760", "72.8777",
    ]


class BulkUploadTestBase(TestCase):

    def setUp(self):
        self.agent = User.objects.create_user(
            username="testagent", password="TestPass123!", role="AGENT",
        )
        self.agent2 = User.objects.create_user(
            username="testagent2", password="TestPass123!", role="AGENT",
        )
        self.buyer = User.objects.create_user(
            username="testbuyer", password="TestPass123!", role="USER",
        )
        self.admin = User.objects.create_user(
            username="testadmin", password="TestPass123!", role="ADMIN",
            is_staff=True,
        )
        self.client = APIClient()

    def auth_as(self, user):
        response = self.client.post(
            "/api/accounts/login/",
            {"username": user.username, "password": "TestPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def post_zip(self, zip_bytes, endpoint="preview"):
        import io as _io
        from django.core.files.uploadedfile import SimpleUploadedFile
        f = SimpleUploadedFile(
            "bulk_properties.zip", zip_bytes, content_type="application/zip"
        )
        return self.client.post(f"/api/bulk-upload/{endpoint}/", {"file": f})


class SuccessfulImportTest(BulkUploadTestBase):

    def test_import_single_property_with_image(self):
        self.auth_as(self.agent)
        img = create_valid_image_bytes()
        zip_bytes = create_zip_bytes([make_valid_row()], {"PROP001": [img]})

        response = self.post_zip(zip_bytes, "import")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["imported"], 1)
        self.assertEqual(response.data["failed"], 0)

        prop = Property.objects.get(title="Test Property")
        self.assertFalse(prop.is_approved)
        self.assertEqual(prop.created_by, self.agent)
        self.assertEqual(prop.gallery_images.count(), 1)

    def test_import_multiple_properties(self):
        self.auth_as(self.agent)
        img = create_valid_image_bytes()
        rows = [make_valid_row("PROP001"), make_valid_row("PROP002")]
        images = {"PROP001": [img], "PROP002": [img]}
        zip_bytes = create_zip_bytes(rows, images)

        response = self.post_zip(zip_bytes, "import")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["imported"], 2)
        self.assertEqual(Property.objects.count(), 2)

    def test_import_property_with_multiple_gallery_images(self):
        self.auth_as(self.agent)
        imgs = [create_valid_image_bytes() for _ in range(5)]
        zip_bytes = create_zip_bytes([make_valid_row()], {"PROP001": imgs})

        response = self.post_zip(zip_bytes, "import")
        self.assertEqual(response.data["imported"], 1)
        prop = Property.objects.get(title="Test Property")
        self.assertEqual(prop.gallery_images.count(), 5)

    def test_import_sets_agent_as_owner(self):
        self.auth_as(self.agent)
        img = create_valid_image_bytes()
        zip_bytes = create_zip_bytes([make_valid_row()], {"PROP001": [img]})

        self.post_zip(zip_bytes, "import")
        prop = Property.objects.first()
        self.assertEqual(prop.created_by, self.agent)

    def test_imported_properties_are_unapproved(self):
        self.auth_as(self.agent)
        img = create_valid_image_bytes()
        zip_bytes = create_zip_bytes([make_valid_row()], {"PROP001": [img]})

        self.post_zip(zip_bytes, "import")
        self.assertFalse(Property.objects.first().is_approved)

    def test_preview_single_property(self):
        self.auth_as(self.agent)
        img = create_valid_image_bytes()
        zip_bytes = create_zip_bytes([make_valid_row()], {"PROP001": [img]})

        response = self.post_zip(zip_bytes, "preview")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["valid_count"], 1)
        self.assertEqual(response.data["invalid_count"], 0)


class ValidationFailureTest(BulkUploadTestBase):

    def test_no_excel_file(self):
        self.auth_as(self.agent)
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("images/PROP001/test.txt", "not an excel")
        from django.core.files.uploadedfile import SimpleUploadedFile
        f = SimpleUploadedFile("bulk.zip", buf.getvalue(), content_type="application/zip")
        response = self.client.post("/api/bulk-upload/preview/", {"file": f})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_required_columns(self):
        self.auth_as(self.agent)
        bad_headers = ["Property ID", "Title", "Price"]
        bad_row = ["PROP001", "Test", "5000000"]
        zip_bytes = create_zip_bytes([bad_row], {}, headers=bad_headers)
        response = self.post_zip(zip_bytes, "preview")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_image_folder(self):
        self.auth_as(self.agent)
        zip_bytes = create_zip_bytes([make_valid_row()], {})
        response = self.post_zip(zip_bytes, "preview")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["missing_images"]), 1)

    def test_duplicate_property_ids(self):
        self.auth_as(self.agent)
        img = create_valid_image_bytes()
        rows = [make_valid_row("PROP001"), make_valid_row("PROP001")]
        zip_bytes = create_zip_bytes(rows, {"PROP001": [img]})
        response = self.post_zip(zip_bytes, "preview")
        self.assertEqual(response.data["invalid_count"], 1)

    def test_invalid_property_type(self):
        self.auth_as(self.agent)
        img = create_valid_image_bytes()
        row = make_valid_row()
        row[3] = "MANSION"
        zip_bytes = create_zip_bytes([row], {"PROP001": [img]})
        response = self.post_zip(zip_bytes, "preview")
        self.assertEqual(response.data["invalid_count"], 1)

    def test_invalid_price(self):
        self.auth_as(self.agent)
        img = create_valid_image_bytes()
        row = make_valid_row()
        row[4] = "free"
        zip_bytes = create_zip_bytes([row], {"PROP001": [img]})
        response = self.post_zip(zip_bytes, "preview")
        self.assertEqual(response.data["invalid_count"], 1)

    def test_invalid_area(self):
        self.auth_as(self.agent)
        img = create_valid_image_bytes()
        row = make_valid_row()
        row[7] = "huge"
        zip_bytes = create_zip_bytes([row], {"PROP001": [img]})
        response = self.post_zip(zip_bytes, "preview")
        self.assertEqual(response.data["invalid_count"], 1)

    def test_missing_required_fields(self):
        self.auth_as(self.agent)
        img = create_valid_image_bytes()
        row = make_valid_row()
        row[1] = ""
        zip_bytes = create_zip_bytes([row], {"PROP001": [img]})
        response = self.post_zip(zip_bytes, "preview")
        self.assertEqual(response.data["invalid_count"], 1)

    def test_no_file_uploaded(self):
        self.auth_as(self.agent)
        response = self.client.post("/api/bulk-upload/preview/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_not_a_zip_file(self):
        self.auth_as(self.agent)
        from django.core.files.uploadedfile import SimpleUploadedFile
        f = SimpleUploadedFile("bulk.zip", b"not a zip", content_type="application/zip")
        response = self.client.post("/api/bulk-upload/preview/", {"file": f})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_more_than_10_images_per_property(self):
        self.auth_as(self.agent)
        imgs = [create_valid_image_bytes() for _ in range(11)]
        zip_bytes = create_zip_bytes([make_valid_row()], {"PROP001": imgs})
        response = self.post_zip(zip_bytes, "preview")
        self.assertEqual(response.data["invalid_count"], 1)


class SecurityTest(BulkUploadTestBase):

    def test_buyer_blocked_from_preview(self):
        self.auth_as(self.buyer)
        response = self.client.post("/api/bulk-upload/preview/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_buyer_blocked_from_import(self):
        self.auth_as(self.buyer)
        response = self.client.post("/api/bulk-upload/import/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_blocked(self):
        response = self.client.post("/api/bulk-upload/preview/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_blocked_from_upload(self):
        self.auth_as(self.admin)
        response = self.client.post("/api/bulk-upload/preview/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_path_traversal_rejected(self):
        self.auth_as(self.agent)
        img = create_valid_image_bytes()
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("properties.xlsx", create_excel_bytes([make_valid_row()]))
            zf.writestr("images/PROP001/../../../etc/passwd", img)
        from django.core.files.uploadedfile import SimpleUploadedFile
        f = SimpleUploadedFile("bulk.zip", buf.getvalue(), content_type="application/zip")
        response = self.client.post("/api/bulk-upload/preview/", {"file": f})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_agent_owns_imported_properties(self):
        self.auth_as(self.agent)
        img = create_valid_image_bytes()
        zip_bytes = create_zip_bytes([make_valid_row()], {"PROP001": [img]})
        self.post_zip(zip_bytes, "import")
        prop = Property.objects.first()
        self.assertEqual(prop.created_by, self.agent)
        self.assertNotEqual(prop.created_by, self.agent2)


class PartialImportTest(BulkUploadTestBase):

    def test_valid_imported_invalid_skipped(self):
        self.auth_as(self.agent)
        img = create_valid_image_bytes()
        good_row = make_valid_row("PROP001")
        bad_row = make_valid_row("PROP002")
        bad_row[3] = "MANSION"
        zip_bytes = create_zip_bytes(
            [good_row, bad_row],
            {"PROP001": [img], "PROP002": [img]},
        )
        response = self.post_zip(zip_bytes, "import")
        self.assertEqual(response.data["imported"], 1)
        self.assertEqual(response.data["failed"], 1)
        self.assertEqual(Property.objects.count(), 1)

    def test_valid_properties_not_lost_when_invalid_exists(self):
        self.auth_as(self.agent)
        img = create_valid_image_bytes()
        good_row = make_valid_row("PROP001")
        bad_row = make_valid_row("PROP002")
        bad_row[4] = "free"
        zip_bytes = create_zip_bytes(
            [good_row, bad_row],
            {"PROP001": [img], "PROP002": [img]},
        )
        self.post_zip(zip_bytes, "import")
        prop = Property.objects.get(title="Test Property")
        self.assertEqual(prop.title, "Test Property")


class HistoryTest(BulkUploadTestBase):

    def test_agent_can_view_own_history(self):
        self.auth_as(self.agent)
        BulkUpload.objects.create(
            agent=self.agent, total_rows=5, imported_rows=3,
            failed_rows=2, status="COMPLETED",
        )
        response = self.client.get("/api/bulk-upload/history/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_agent_cannot_view_other_agent_history(self):
        self.auth_as(self.agent2)
        BulkUpload.objects.create(
            agent=self.agent, total_rows=5, imported_rows=3,
            failed_rows=2, status="COMPLETED",
        )
        response = self.client.get("/api/bulk-upload/history/")
        data = response.data if isinstance(response.data, list) else response.data.get("results", response.data)
        self.assertEqual(len(data), 0)

    def test_import_detail_shows_counts(self):
        self.auth_as(self.agent)
        upload = BulkUpload.objects.create(
            agent=self.agent, total_rows=10, imported_rows=7,
            failed_rows=3, status="COMPLETED",
        )
        response = self.client.get(f"/api/bulk-upload/{upload.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["imported_rows"], 7)
        self.assertEqual(response.data["failed_rows"], 3)

    def test_agent_cannot_access_other_agent_detail(self):
        self.auth_as(self.agent2)
        upload = BulkUpload.objects.create(
            agent=self.agent, total_rows=5, imported_rows=3,
            failed_rows=2, status="COMPLETED",
        )
        response = self.client.get(f"/api/bulk-upload/{upload.pk}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
