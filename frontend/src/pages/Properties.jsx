import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import "./Properties.css";

const PROPERTY_TYPES = [
  { value: "FLAT", label: "Flat" },
  { value: "HOUSE", label: "House" },
  { value: "VILLA", label: "Villa" },
  { value: "PLOT", label: "Plot" },
];

const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest First" },
  { value: "created_at", label: "Oldest First" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "-bedrooms", label: "Most Bedrooms" },
];

function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Form input state — initialized from URL params on mount
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [city, setCity] = useState(
    searchParams.get("city") || ""
  );
  const [propertyType, setPropertyType] = useState(
    searchParams.get("property_type") || ""
  );
  const [minPrice, setMinPrice] = useState(
    searchParams.get("min_price") || ""
  );
  const [maxPrice, setMaxPrice] = useState(
    searchParams.get("max_price") || ""
  );
  const [bedrooms, setBedrooms] = useState(
    searchParams.get("bedrooms") || ""
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("ordering") || "-created_at"
  );

  // URL param values — these drive the fetch and only change on form submit
  const urlSearch = searchParams.get("search") || "";
  const urlCity = searchParams.get("city") || "";
  const urlType = searchParams.get("property_type") || "";
  const urlMinPrice = searchParams.get("min_price") || "";
  const urlMaxPrice = searchParams.get("max_price") || "";
  const urlBedrooms = searchParams.get("bedrooms") || "";
  const urlOrdering = searchParams.get("ordering") || "-created_at";

  // Fetch properties when URL params change (mount + form submit)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (urlSearch)
          params.append("search", urlSearch);
        if (urlCity)
          params.append("city", urlCity);
        if (urlType)
          params.append("property_type", urlType);
        if (urlMinPrice)
          params.append("min_price", urlMinPrice);
        if (urlMaxPrice)
          params.append("max_price", urlMaxPrice);
        if (urlBedrooms)
          params.append("bedrooms", urlBedrooms);
        if (urlOrdering)
          params.append("ordering", urlOrdering);

        const response = await api.get(
          `/properties/list/?${params.toString()}`
        );

        if (!cancelled) {
          setProperties(
            response.data.results || response.data
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Properties error:", err);

          setError(
            err.response?.data?.detail ||
              "Unable to load properties."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    urlSearch,
    urlCity,
    urlType,
    urlMinPrice,
    urlMaxPrice,
    urlBedrooms,
    urlOrdering,
  ]);

  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (searchQuery.trim())
      params.append("search", searchQuery.trim());
    if (city.trim())
      params.append("city", city.trim());
    if (propertyType)
      params.append("property_type", propertyType);
    if (minPrice)
      params.append("min_price", minPrice);
    if (maxPrice)
      params.append("max_price", maxPrice);
    if (bedrooms)
      params.append("bedrooms", bedrooms);
    if (sortBy && sortBy !== "-created_at")
      params.append("ordering", sortBy);

    setSearchParams(params);
    setHasSearched(true);
  };

  const handleReset = () => {
    setSearchQuery("");
    setCity("");
    setPropertyType("");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("");
    setSortBy("-created_at");
    setSearchParams(new URLSearchParams());
    setHasSearched(false);
  };

  return (
    <div className="properties-page">
      {/* ========================= */}
      {/* PAGE HEADER */}
      {/* ========================= */}

      <div className="properties-header">
        <h1>Browse Properties</h1>

        <p>
          Find your next home from our collection of
          verified listings.
        </p>
      </div>

      {/* ========================= */}
      {/* SEARCH & FILTER BAR */}
      {/* ========================= */}

      <form
        className="properties-filters"
        onSubmit={handleSearch}
      >
        <div className="properties-filter-field">
          <label htmlFor="filter-search">
            Search
          </label>

          <input
            id="filter-search"
            type="text"
            placeholder="Title, address, description..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>

        <div className="properties-filter-field">
          <label htmlFor="filter-city">City</label>

          <input
            id="filter-city"
            type="text"
            placeholder="Enter city"
            value={city}
            onChange={(e) =>
              setCity(e.target.value)
            }
          />
        </div>

        <div className="properties-filter-field">
          <label htmlFor="filter-type">
            Property Type
          </label>

          <select
            id="filter-type"
            value={propertyType}
            onChange={(e) =>
              setPropertyType(e.target.value)
            }
          >
            <option value="">Any</option>

            {PROPERTY_TYPES.map((pt) => (
              <option
                key={pt.value}
                value={pt.value}
              >
                {pt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="properties-filter-field">
          <label htmlFor="filter-bedrooms">
            Bedrooms
          </label>

          <select
            id="filter-bedrooms"
            value={bedrooms}
            onChange={(e) =>
              setBedrooms(e.target.value)
            }
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </div>

        <div className="properties-filter-field">
          <label htmlFor="filter-min-price">
            Min Price (₹)
          </label>

          <input
            id="filter-min-price"
            type="number"
            min="0"
            placeholder="No min"
            value={minPrice}
            onChange={(e) =>
              setMinPrice(e.target.value)
            }
          />
        </div>

        <div className="properties-filter-field">
          <label htmlFor="filter-max-price">
            Max Price (₹)
          </label>

          <input
            id="filter-max-price"
            type="number"
            min="0"
            placeholder="No max"
            value={maxPrice}
            onChange={(e) =>
              setMaxPrice(e.target.value)
            }
          />
        </div>

        <div className="properties-filter-field">
          <label htmlFor="filter-sort">Sort By</label>

          <select
            id="filter-sort"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value)
            }
          >
            {SORT_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="properties-filter-actions">
          <button
            type="submit"
            className="properties-filter-button"
          >
            Search
          </button>

          <button
            type="button"
            className="properties-filter-reset"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </form>

      {/* ========================= */}
      {/* RESULTS */}
      {/* ========================= */}

      {loading ? (
        <div className="properties-loading">
          <div className="properties-skeleton-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                className="properties-skeleton-card"
                key={i}
              >
                <div className="properties-skeleton-image"></div>
                <div className="properties-skeleton-body">
                  <div className="properties-skeleton-line properties-skeleton-line-short"></div>
                  <div className="properties-skeleton-line properties-skeleton-line-long"></div>
                  <div className="properties-skeleton-line properties-skeleton-line-medium"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="properties-error-state">
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button
            className="properties-retry-button"
            onClick={handleReset}
          >
            Try Again
          </button>
        </div>
      ) : properties.length === 0 ? (
        <div className="properties-empty-state">
          <h3>No properties found</h3>
          <p>
            {hasSearched
              ? "Try adjusting your search filters."
              : "No properties are available yet."}
          </p>
          {hasSearched && (
            <button
              className="properties-retry-button"
              onClick={handleReset}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="properties-results-info">
            {properties.length}{" "}
            {properties.length === 1
              ? "property"
              : "properties"}{" "}
            found
          </div>

          <div className="properties-grid">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ========================= */
/* PROPERTY CARD */
/* ========================= */

function PropertyCard({ property }) {
  const formatPrice = (price) => {
    const num = Number(price);

    if (num >= 10000000) {
      return `₹ ${(num / 10000000).toFixed(2)} Cr`;
    }

    if (num >= 100000) {
      return `₹ ${(num / 100000).toFixed(2)} L`;
    }

    return `₹ ${num.toLocaleString("en-IN")}`;
  };

  const typeLabel =
    {
      FLAT: "Flat",
      HOUSE: "House",
      VILLA: "Villa",
      PLOT: "Plot",
    }[property.property_type] || property.property_type;

  return (
    <Link
      to={`/properties/${property.id}`}
      className="properties-card"
    >
      <div className="properties-card-image-wrap">
        {property.image ? (
          <img
            src={property.image}
            alt={property.title}
            className="properties-card-image"
          />
        ) : (
          <div className="properties-card-no-image">
            No Image Available
          </div>
        )}

        {property.is_featured && (
          <span className="properties-card-badge">
            Featured
          </span>
        )}

        <span className="properties-card-type-badge">
          {typeLabel}
        </span>
      </div>

      <div className="properties-card-body">
        <h3 className="properties-card-title">
          {property.title}
        </h3>

        <p className="properties-card-price">
          {formatPrice(property.price)}
        </p>

        <p className="properties-card-location">
          {property.city}, {property.state}
        </p>

        <div className="properties-card-features">
          <span className="properties-card-feature">
            <strong>{property.bedrooms}</strong> Beds
          </span>
          <span className="properties-card-feature">
            <strong>{property.bathrooms}</strong> Baths
          </span>
          <span className="properties-card-feature">
            <strong>
              {Number(property.area_sqft).toLocaleString()}
            </strong>{" "}
            sq.ft
          </span>
        </div>

        <span className="properties-card-link">
          View Details →
        </span>
      </div>
    </Link>
  );
}

export default Properties;
