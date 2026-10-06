import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./CreateProperty.css";

function CreateProperty() {
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = new FormData();

      Object.entries(formData).forEach(
        ([key, value]) => {
          if (value !== "") {
            data.append(key, value);
          }
        }
      );

      if (image) {
        data.append("image", image);
      }

      await api.post(
        "/properties/create/",
        data
      );

      setSuccess(
        "Property submitted successfully! It is now waiting for approval."
      );

      setTimeout(() => {
        navigate("/my-properties");
      }, 1500);

    } catch (error) {
      console.error(
        "Create property error:",
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
          "Unable to create property. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-property-page">

      <div className="create-property-container">

        <div className="create-property-header">

          <div>
            <h1>Add Property</h1>

            <p>
              List a new property on RealEstate AI.
            </p>
          </div>

          <Link
            to="/my-properties"
            className="back-button"
          >
            ← My Properties
          </Link>

        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

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
                  placeholder="e.g. 2BHK Flat in New Town"
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
                  placeholder="Describe the property..."
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
                  placeholder="e.g. 5000000"
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
                  placeholder="e.g. 1200"
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
                  placeholder="Full property address"
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
                  placeholder="e.g. Kolkata"
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
                  placeholder="e.g. West Bengal"
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
                  placeholder="e.g. 700156"
                  required
                />

              </div>

            </div>

          </section>

          {/* COORDINATES */}

          <section className="form-section">

            <h2>Map Coordinates</h2>

            <p className="section-help">
              Optional. You can add latitude and
              longitude for the property location.
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
                  placeholder="e.g. 22.5726"
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
                  placeholder="e.g. 88.3639"
                  step="any"
                />

              </div>

            </div>

          </section>

          {/* IMAGE */}

          <section className="form-section">

            <h2>Property Image</h2>

            <div className="form-group">

              <label>
                Upload Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />

              <p className="section-help">
                Upload a clear image of the property.
              </p>

            </div>

          </section>

          {/* SUBMIT */}

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
              disabled={loading}
            >
              {loading
                ? "Submitting..."
                : "Submit Property"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default CreateProperty;