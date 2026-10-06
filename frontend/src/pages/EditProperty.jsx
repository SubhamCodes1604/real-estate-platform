import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./EditProperty.css";

function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    property_type: "FLAT",
    price: "",
    bedrooms: "",
    bathrooms: "",
    area_sqft: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
  });

  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * Load property
   */
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await api.get(
          "/properties/my-properties/"
        );

        const properties = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        const property = properties.find(
          (item) => String(item.id) === String(id)
        );

        if (!property) {
          setError(
            "Property not found or you do not have permission to edit it."
          );
          return;
        }

        setFormData({
          title: property.title || "",
          description: property.description || "",
          property_type: property.property_type || "FLAT",
          price: property.price || "",
          bedrooms: property.bedrooms ?? "",
          bathrooms: property.bathrooms ?? "",
          area_sqft: property.area_sqft ?? "",
          address: property.address || "",
          city: property.city || "",
          state: property.state || "",
          pincode: property.pincode || "",
          latitude: property.latitude ?? "",
          longitude: property.longitude ?? "",
        });

        setCurrentImage(property.image || "");

      } catch (error) {
        console.error(
          "Edit property loading error:",
          error
        );

        setError(
          error.response?.data?.detail ||
          "Unable to load property."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  /*
   * Handle text/input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
   * Handle image
   */
  const handleImageChange = (e) => {
    setImage(e.target.files[0] || null);
  };

  /*
   * Submit update
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const data = new FormData();

      Object.entries(formData).forEach(
        ([key, value]) => {
          if (value !== "" && value !== null) {
            data.append(key, value);
          }
        }
      );

      /*
       * Only send image if the agent selected
       * a new one.
       */
      if (image) {
        data.append("image", image);
      }

      await api.put(
        `/properties/update/${id}/`,
        data
      );

      setSuccess(
        "Property updated successfully!"
      );

      setTimeout(() => {
        navigate("/my-properties");
      }, 1200);

    } catch (error) {
      console.error(
        "Update property error:",
        error
      );

      const responseData =
        error.response?.data;

      if (responseData) {
        const messages = Object.entries(
          responseData
        ).map(([field, message]) => {
          const text = Array.isArray(message)
            ? message.join(" ")
            : message;

          return `${field}: ${text}`;
        });

        setError(messages.join(" | "));

      } else {
        setError(
          "Unable to update property. Please try again."
        );
      }

    } finally {
      setSaving(false);
    }
  };

  /*
   * Loading screen
   */
  if (loading) {
    return (
      <div className="edit-property-page">
        <div className="edit-property-container">
          <h1>Edit Property</h1>
          <p>Loading property...</p>
        </div>
      </div>
    );
  }

  /*
   * Error screen
   */
  if (error && !formData.title) {
    return (
      <div className="edit-property-page">
        <div className="edit-property-container">

          <h1>Edit Property</h1>

          <div className="form-error">
            {error}
          </div>

          <Link
            to="/my-properties"
            className="back-button"
          >
            ← Back to My Properties
          </Link>

        </div>
      </div>
    );
  }

  return (
    <div className="edit-property-page">

      <div className="edit-property-container">

        {/* HEADER */}

        <div className="edit-property-header">

          <div>
            <h1>Edit Property</h1>

            <p>
              Update the information for your property.
            </p>
          </div>

          <Link
            to="/my-properties"
            className="back-button"
          >
            ← My Properties
          </Link>

        </div>

        {/* ERROR */}

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="form-success">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="property-form"
        >

          {/* BASIC INFORMATION */}

          <section className="form-section">

            <h2>Basic Information</h2>

            <div className="form-grid">

              <div className="form-group full-width">

                <label>
                  Property Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-group full-width">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="5"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Property Type
                </label>

                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  required
                >
                  <option value="FLAT">
                    Flat
                  </option>

                  <option value="HOUSE">
                    House
                  </option>

                  <option value="VILLA">
                    Villa
                  </option>

                  <option value="PLOT">
                    Plot
                  </option>

                </select>

              </div>

              <div className="form-group">

                <label>
                  Price (₹)
                </label>

                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />

              </div>

            </div>

          </section>

          {/* PROPERTY FEATURES */}

          <section className="form-section">

            <h2>Property Features</h2>

            <div className="form-grid">

              <div className="form-group">

                <label>
                  Bedrooms
                </label>

                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  min="0"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Bathrooms
                </label>

                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  min="0"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Area (sq.ft)
                </label>

                <input
                  type="number"
                  name="area_sqft"
                  value={formData.area_sqft}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />

              </div>

            </div>

          </section>

          {/* LOCATION */}

          <section className="form-section">

            <h2>Location</h2>

            <div className="form-grid">

              <div className="form-group full-width">

                <label>
                  Address
                </label>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  City
                </label>

                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  State
                </label>

                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Pincode
                </label>

                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>

          </section>

          {/* COORDINATES */}

          <section className="form-section">

            <h2>Map Coordinates</h2>

            <p className="section-help">
              Optional. Update the latitude and
              longitude if needed.
            </p>

            <div className="form-grid">

              <div className="form-group">

                <label>
                  Latitude
                </label>

                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  step="any"
                />

              </div>

              <div className="form-group">

                <label>
                  Longitude
                </label>

                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  step="any"
                />

              </div>

            </div>

          </section>

          {/* IMAGE */}

          <section className="form-section">

            <h2>Property Image</h2>

            {currentImage && (
              <div className="current-image-section">

                <p>
                  Current Image
                </p>

                <img
                  src={currentImage}
                  alt={formData.title}
                  className="current-property-image"
                />

              </div>
            )}

            <div className="form-group">

              <label>
                Upload New Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />

              <p className="section-help">
                Leave this empty if you want to keep
                the current image.
              </p>

            </div>

          </section>

          {/* ACTIONS */}

          <div className="form-actions">

            <Link
              to="/my-properties"
              className="cancel-button"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="submit-button"
              disabled={saving}
            >
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default EditProperty;