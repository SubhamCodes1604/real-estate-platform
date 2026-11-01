import io
import os
import zipfile

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView

from properties.models import Property
from accounts.models import User
from accounts.permissions import IsAgentRole
from .models import BulkUpload, PropertyImage
from .serializers import BulkUploadSerializer


MAX_PROPERTIES = 100
MAX_IMAGES_PER_PROPERTY = 10
MAX_ZIP_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
VALID_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

VALID_PROPERTY_TYPES = {"FLAT", "HOUSE", "VILLA", "PLOT"}

REQUIRED_COLUMNS = [
    "Property ID", "Title", "Description",
    "Property Type", "Price", "Bedrooms",
    "Bathrooms", "Area (sqft)", "Address",
    "City", "State", "Pincode",
]


def validate_zip_path(path, base_dir="/"):
    """Prevent path traversal in ZIP entries."""
    normalized = os.path.normpath(path)
    if ".." in normalized.split(os.sep):
        return False
    if os.path.isabs(normalized):
        return False
    return True


def parse_excel_row(row, row_num):
    """Parse and validate a single Excel row dict."""
    errors = []

    property_id = str(row.get("Property ID", "")).strip()
    if not property_id:
        errors.append("Property ID is required.")

    title = str(row.get("Title", "")).strip()
    if not title:
        errors.append("Title is required.")

    description = str(row.get("Description", "")).strip()

    property_type = str(row.get("Property Type", "")).strip().upper()
    if not property_type:
        errors.append("Property Type is required.")
    elif property_type not in VALID_PROPERTY_TYPES:
        errors.append(
            f"Invalid property type '{property_type}'. "
            f"Must be one of: {', '.join(sorted(VALID_PROPERTY_TYPES))}."
        )

    price_raw = str(row.get("Price", "")).strip()
    if not price_raw:
        errors.append("Price is required.")
    else:
        try:
            price = float(price_raw)
            if price <= 0:
                errors.append("Price must be a positive number.")
        except ValueError:
            errors.append(
                f"Price must be a number, got '{price_raw}'."
            )

    bedrooms_raw = str(row.get("Bedrooms", "")).strip()
    if not bedrooms_raw:
        errors.append("Bedrooms is required.")
    else:
        try:
            bedrooms = int(float(bedrooms_raw))
            if bedrooms < 0:
                errors.append("Bedrooms must be 0 or more.")
        except ValueError:
            errors.append(
                f"Bedrooms must be an integer, got '{bedrooms_raw}'."
            )

    bathrooms_raw = str(row.get("Bathrooms", "")).strip()
    if not bathrooms_raw:
        errors.append("Bathrooms is required.")
    else:
        try:
            bathrooms = int(float(bathrooms_raw))
            if bathrooms < 0:
                errors.append("Bathrooms must be 0 or more.")
        except ValueError:
            errors.append(
                f"Bathrooms must be an integer, got '{bathrooms_raw}'."
            )

    area_raw = str(row.get("Area (sqft)", "")).strip()
    if not area_raw:
        errors.append("Area (sqft) is required.")
    else:
        try:
            area = float(area_raw)
            if area <= 0:
                errors.append("Area must be a positive number.")
        except ValueError:
            errors.append(
                f"Area must be a number, got '{area_raw}'."
            )

    address = str(row.get("Address", "")).strip()
    if not address:
        errors.append("Address is required.")

    city = str(row.get("City", "")).strip()
    if not city:
        errors.append("City is required.")

    state = str(row.get("State", "")).strip()
    if not state:
        errors.append("State is required.")

    pincode = str(row.get("Pincode", "")).strip()
    if not pincode:
        errors.append("Pincode is required.")

    latitude_raw = str(row.get("Latitude", "")).strip()
    latitude = None
    if latitude_raw:
        try:
            latitude = float(latitude_raw)
        except ValueError:
            errors.append(
                f"Latitude must be a number, got '{latitude_raw}'."
            )

    longitude_raw = str(row.get("Longitude", "")).strip()
    longitude = None
    if longitude_raw:
        try:
            longitude = float(longitude_raw)
        except ValueError:
            errors.append(
                f"Longitude must be a number, got '{longitude_raw}'."
            )

    return {
        "row_num": row_num,
        "property_id": property_id,
        "title": title,
        "description": description,
        "property_type": property_type,
        "price_raw": price_raw,
        "bedrooms_raw": bedrooms_raw,
        "bathrooms_raw": bathrooms_raw,
        "area_raw": area_raw,
        "address": address,
        "city": city,
        "state": state,
        "pincode": pincode,
        "latitude": latitude,
        "longitude": longitude,
        "errors": errors,
    }


def read_zip_contents(zip_file):
    """Read and return the Excel rows and image mapping from a ZIP."""
    if not zip_file.name.lower().endswith(".zip"):
        raise ValueError("File must have a .zip extension.")

    if zip_file.size > MAX_ZIP_SIZE:
        raise ValueError(
            f"ZIP file exceeds maximum size of "
            f"{MAX_ZIP_SIZE // (1024 * 1024)} MB."
        )

    try:
        zf = zipfile.ZipFile(zip_file)
    except zipfile.BadZipFile:
        raise ValueError("Invalid or corrupted ZIP file.")

    names = zf.namelist()

    excel_name = None
    for name in names:
        lower = name.lower()
        if lower.endswith(".xlsx") or lower.endswith(".xls"):
            excel_name = name
            break

    if not excel_name:
        raise ValueError(
            "No Excel file found in ZIP. "
            "Expected 'properties.xlsx' in root."
        )

    # Read Excel
    try:
        import openpyxl

        excel_data = zf.read(excel_name)
        wb = openpyxl.load_workbook(
            io.BytesIO(excel_data), read_only=True
        )
        ws = wb.active

        rows_raw = list(ws.iter_rows(values_only=True))
        if len(rows_raw) < 2:
            raise ValueError(
                "Excel file has no data rows."
            )

        headers = [str(h).strip() if h else "" for h in rows_raw[0]]
        for req_col in REQUIRED_COLUMNS:
            if req_col not in headers:
                raise ValueError(
                    f"Missing required column: '{req_col}'."
                )

        col_map = {h: idx for idx, h in enumerate(headers)}

        rows = []
        for i, raw_row in enumerate(rows_raw[1:], start=2):
            row_dict = {}
            for h, idx in col_map.items():
                val = raw_row[idx] if idx < len(raw_row) else ""
                row_dict[h] = val if val is not None else ""
            rows.append((i, row_dict))

    except ImportError:
        raise ValueError(
            "Server cannot process Excel files. "
            "openpyxl is not installed."
        )
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Error reading Excel: {e}")

    if len(rows) > MAX_PROPERTIES:
        raise ValueError(
            f"Excel contains {len(rows)} rows. "
            f"Maximum is {MAX_PROPERTIES} properties per ZIP."
        )

    # Check all ZIP entries for path traversal
    for name in names:
        if not validate_zip_path(name):
            raise ValueError(
                f"Unsafe ZIP path detected: {name}"
            )

    # Collect images
    image_map = {}
    image_dir_prefix = "images/"
    for name in names:
        if name.lower().startswith(image_dir_prefix) and not name.endswith("/"):
            parts = name.split("/")
            if len(parts) < 3:
                continue

            folder = parts[1]
            filename = parts[-1]
            ext = os.path.splitext(filename)[1].lower()

            if ext not in VALID_IMAGE_EXTENSIONS:
                continue

            image_map.setdefault(folder, []).append(name)

    return rows, image_map, zf


class BulkUploadPreviewView(APIView):
    """Accepts a ZIP file and returns a preview without importing."""

    permission_classes = [IsAgentRole]

    def post(self, request):
        zip_file = request.FILES.get("file") or request.FILES.get("zip")

        if not zip_file:
            return Response(
                {"detail": "ZIP file is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            rows, image_map, zf = read_zip_contents(zip_file)
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"detail": f"Unexpected error: {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        seen_ids = set()
        valid_rows = []
        invalid_rows = []
        missing_images = []

        for row_num, row_dict in rows:
            parsed = parse_excel_row(row_dict, row_num)

            if parsed["property_id"] in seen_ids:
                parsed["errors"].append(
                    f"Duplicate Property ID '{parsed['property_id']}' "
                    "in this batch."
                )

            seen_ids.add(parsed["property_id"])

            if parsed["property_id"]:
                images = image_map.get(parsed["property_id"], [])
                if len(images) == 0:
                    missing_images.append({
                        "property_id": parsed["property_id"],
                        "message": "No images found for this property.",
                    })
                elif len(images) > MAX_IMAGES_PER_PROPERTY:
                    parsed["errors"].append(
                        f"Property has {len(images)} images. "
                        f"Maximum is {MAX_IMAGES_PER_PROPERTY}."
                    )

            if parsed["errors"]:
                invalid_rows.append(parsed)
            else:
                valid_rows.append(parsed)

        return Response({
            "total_rows": len(rows),
            "valid_count": len(valid_rows),
            "invalid_count": len(invalid_rows),
            "valid_rows": valid_rows,
            "invalid_rows": invalid_rows,
            "missing_images": missing_images,
            "image_count": sum(len(v) for v in image_map.values()),
        }, status=status.HTTP_200_OK)


class BulkUploadImportView(APIView):
    """Imports properties from a previously validated ZIP file."""

    permission_classes = [IsAgentRole]

    def post(self, request):
        zip_file = request.FILES.get("file") or request.FILES.get("zip")

        if not zip_file:
            return Response(
                {"detail": "ZIP file is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            rows, image_map, zf = read_zip_contents(zip_file)
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"detail": f"Unexpected error: {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        seen_ids = set()
        valid_rows = []
        invalid_rows = []

        for row_num, row_dict in rows:
            parsed = parse_excel_row(row_dict, row_num)
            if parsed["property_id"] in seen_ids:
                parsed["errors"].append(
                    f"Duplicate Property ID '{parsed['property_id']}' "
                    "in this batch."
                )
            seen_ids.add(parsed["property_id"])
            if parsed["errors"]:
                invalid_rows.append(parsed)
            else:
                valid_rows.append(parsed)

        imported = 0
        failed = 0
        error_log = []
        agent = request.user

        upload_record = BulkUpload.objects.create(
            agent=agent,
            total_rows=len(rows),
            imported_rows=0,
            failed_rows=0,
            errors=[],
            status="PROCESSING",
        )

        for row in valid_rows:
            try:
                with transaction.atomic():
                    prop = Property.objects.create(
                        title=row["title"],
                        description=row["description"],
                        property_type=row["property_type"],
                        price=row["price_raw"],
                        bedrooms=int(float(row["bedrooms_raw"])),
                        bathrooms=int(float(row["bathrooms_raw"])),
                        area_sqft=float(row["area_raw"]),
                        address=row["address"],
                        city=row["city"],
                        state=row["state"],
                        pincode=row["pincode"],
                        latitude=row["latitude"],
                        longitude=row["longitude"],
                        is_approved=False,
                        created_by=agent,
                    )

                    images = image_map.get(row["property_id"], [])
                    for idx, img_path in enumerate(
                        sorted(images)[:MAX_IMAGES_PER_PROPERTY]
                    ):
                        ext = os.path.splitext(img_path)[1].lower()
                        safe_name = (
                            f"{row['property_id']}_{idx}{ext}"
                        )

                        img_data = zf.read(img_path)

                        if len(img_data) > MAX_IMAGE_SIZE:
                            raise ValueError(
                                f"Image {img_path} exceeds "
                                f"max size of "
                                f"{MAX_IMAGE_SIZE // (1024 * 1024)} MB."
                            )

                        from PIL import Image
                        import io as _io

                        try:
                            img = Image.open(_io.BytesIO(img_data))
                            img.verify()
                        except Exception:
                            raise ValueError(
                                f"Invalid image file: {img_path}"
                            )

                        storage_path = (
                            f"properties/gallery/{safe_name}"
                        )

                        if idx == 0:
                            prop.image.save(
                                safe_name,
                                ContentFile(img_data),
                            )
                            prop.save(update_fields=["image"])

                        PropertyImage.objects.create(
                            property=prop,
                            image=ContentFile(img_data, name=safe_name),
                            order=idx,
                        )

                    imported += 1

            except Exception as e:
                failed += 1
                error_log.append({
                    "property_id": row["property_id"],
                    "row": row["row_num"],
                    "error": str(e),
                })

        for row in invalid_rows:
            failed += 1
            error_log.append({
                "property_id": row["property_id"],
                "row": row["row_num"],
                "errors": row["errors"],
            })

        upload_record.imported_rows = imported
        upload_record.failed_rows = failed
        upload_record.errors = error_log
        upload_record.status = "COMPLETED"
        upload_record.save()

        serializer = BulkUploadSerializer(upload_record)

        return Response({
            "upload": serializer.data,
            "imported": imported,
            "failed": failed,
            "total": len(rows),
        }, status=status.HTTP_201_CREATED)


class BulkUploadHistoryView(ListAPIView):
    """List bulk upload history for the authenticated agent."""

    serializer_class = BulkUploadSerializer
    permission_classes = [IsAgentRole]

    def get_queryset(self):
        return BulkUpload.objects.filter(
            agent=self.request.user
        ).order_by("-created_at")


class BulkUploadDetailView(RetrieveAPIView):
    """Retrieve details of a specific bulk upload."""

    serializer_class = BulkUploadSerializer
    permission_classes = [IsAgentRole]

    def get_queryset(self):
        return BulkUpload.objects.filter(
            agent=self.request.user
        )


class BulkUploadTemplateView(APIView):
    """Generate and return an Excel template for download."""

    permission_classes = [IsAgentRole]

    def get(self, request):
        try:
            import openpyxl
        except ImportError:
            return Response(
                {"detail": "Template generation unavailable."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Properties"

        headers = REQUIRED_COLUMNS + ["Latitude", "Longitude"]
        ws.append(headers)

        ws.append([
            "PROP001",
            "Sample Property",
            "A beautiful 2BHK flat",
            "FLAT",
            "5000000",
            "2",
            "2",
            "1000",
            "123 Main Street",
            "Mumbai",
            "Maharashtra",
            "400001",
            "19.0760",
            "72.8777",
        ])

        for col in range(1, len(headers) + 1):
            ws.column_dimensions[
                openpyxl.utils.get_column_letter(col)
            ].width = 20

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        from django.http import HttpResponse

        response = HttpResponse(
            output.read(),
            content_type=(
                "application/vnd.openxmlformats-"
                "officedocument.spreadsheetml.sheet"
            ),
        )
        response["Content-Disposition"] = (
            'attachment; filename="bulk_properties_template.xlsx"'
        )

        return response
