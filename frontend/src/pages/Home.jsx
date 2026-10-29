import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

const PROPERTY_TYPES = [
  { value: "FLAT", label: "Flats" },
  { value: "HOUSE", label: "Houses" },
  { value: "VILLA", label: "Villas" },
  { value: "PLOT", label: "Plots" },
];

function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [featured, setFeatured] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchCity, setSearchCity] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchMinPrice, setSearchMinPrice] = useState("");
  const [searchMaxPrice, setSearchMaxPrice] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, recentRes] = await Promise.all([
          api.get("/properties/featured/").catch(() => ({ data: [] })),
          api.get("/properties/recent/").catch(() => ({ data: [] })),
        ]);

        setFeatured(featuredRes.data?.results || featuredRes.data || []);
        setRecent(
          (recentRes.data?.results || recentRes.data || []).slice(0, 6)
        );
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (searchCity.trim()) params.append("city", searchCity.trim());
    if (searchType) params.append("property_type", searchType);
    if (searchMinPrice) params.append("min_price", searchMinPrice);
    if (searchMaxPrice) params.append("max_price", searchMaxPrice);

    navigate(`/properties?${params.toString()}`);
  };

  const isAgent = user?.role === "AGENT";

  return (
    <div className="home-page">
      {/* ========================= */}
      {/* HERO SECTION */}
      {/* ========================= */}

      <section className="hero">
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <h1 className="hero-title">
            Find Your Perfect Home with AI
          </h1>

          <p className="hero-subtitle">
            Browse thousands of verified properties, get
            AI-powered recommendations, and connect with
            trusted agents — all in one place.
          </p>

          {/* SEARCH BAR */}

          <form
            className="hero-search"
            onSubmit={handleSearch}
          >
            <div className="hero-search-field">
              <label htmlFor="search-city">Location</label>

              <input
                id="search-city"
                type="text"
                placeholder="Enter city"
                value={searchCity}
                onChange={(e) =>
                  setSearchCity(e.target.value)
                }
              />
            </div>

            <div className="hero-search-field">
              <label htmlFor="search-type">
                Property Type
              </label>

              <select
                id="search-type"
                value={searchType}
                onChange={(e) =>
                  setSearchType(e.target.value)
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

            <div className="hero-search-field">
              <label htmlFor="search-min-price">
                Min Price (₹)
              </label>

              <input
                id="search-min-price"
                type="number"
                min="0"
                placeholder="No min"
                value={searchMinPrice}
                onChange={(e) =>
                  setSearchMinPrice(e.target.value)
                }
              />
            </div>

            <div className="hero-search-field">
              <label htmlFor="search-max-price">
                Max Price (₹)
              </label>

              <input
                id="search-max-price"
                type="number"
                min="0"
                placeholder="No max"
                value={searchMaxPrice}
                onChange={(e) =>
                  setSearchMaxPrice(e.target.value)
                }
              />
            </div>

            <button
              type="submit"
              className="hero-search-button"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ========================= */}
      {/* CATEGORIES */}
      {/* ========================= */}

      <section className="home-section">
        <div className="home-section-header">
          <h2>Browse by Category</h2>

          <p>
            Find the right type of property for your needs.
          </p>
        </div>

        <div className="category-grid">
          {PROPERTY_TYPES.map((pt) => (
            <Link
              key={pt.value}
              to={`/properties?property_type=${pt.value}`}
              className="category-card"
            >
              <span className="category-name">
                {pt.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================= */}
      {/* FEATURED PROPERTIES */}
      {/* ========================= */}

      <section className="home-section">
        <div className="home-section-header">
          <h2>Featured Properties</h2>

          <Link
            to="/properties"
            className="home-section-link"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="home-loading">
            Loading featured properties...
          </div>
        ) : error ? (
          <div className="home-error">
            Unable to load featured properties right now.
          </div>
        ) : featured.length === 0 ? (
          <div className="home-empty">
            No featured properties available at the moment.
          </div>
        ) : (
          <div className="home-property-grid">
            {featured.slice(0, 3).map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
              />
            ))}
          </div>
        )}
      </section>

      {/* ========================= */}
      {/* RECENTLY LISTED */}
      {/* ========================= */}

      <section className="home-section">
        <div className="home-section-header">
          <h2>Recently Listed</h2>

          <Link
            to="/properties"
            className="home-section-link"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="home-loading">
            Loading recent properties...
          </div>
        ) : error ? (
          <div className="home-error">
            Unable to load recent properties right now.
          </div>
        ) : recent.length === 0 ? (
          <div className="home-empty">
            No properties available at the moment.
          </div>
        ) : (
          <div className="home-property-grid">
            {recent.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
              />
            ))}
          </div>
        )}
      </section>

      {/* ========================= */}
      {/* CALL TO ACTION */}
      {/* ========================= */}

      <section className="home-cta">
        <div className="home-cta-card">
          <h2>Are you an agent?</h2>

          <p>
            List your properties and reach thousands of
            potential buyers. Start by creating your first
            listing today.
          </p>

          <Link
            to={isAuthenticated && isAgent ? "/properties/create" : "/register"}
            className="home-cta-button"
          >
            {isAuthenticated && isAgent
              ? "List a Property"
              : "Get Started"}
          </Link>
        </div>

        <div className="home-cta-card">
          <h2>Have questions?</h2>

          <p>
            Join our community Q&A to ask questions, share
            insights, and get AI-assisted answers about
            real estate.
          </p>

          <Link
            to="/questions"
            className="home-cta-button home-cta-button-secondary"
          >
            Explore Community Q&A
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ========================= */
/* SHARED PROPERTY CARD */
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
      className="home-property-card"
    >
      <div className="home-property-image-wrap">
        {property.image ? (
          <img
            src={property.image}
            alt={property.title}
            className="home-property-image"
          />
        ) : (
          <div className="home-property-no-image">
            No Image Available
          </div>
        )}

        {property.is_featured && (
          <span className="home-property-badge">
            Featured
          </span>
        )}
      </div>

      <div className="home-property-body">
        <span className="home-property-type">
          {typeLabel}
        </span>

        <h3 className="home-property-title">
          {property.title}
        </h3>

        <p className="home-property-price">
          {formatPrice(property.price)}
        </p>

        <p className="home-property-location">
          {property.city}, {property.state}
        </p>

        <div className="home-property-features">
          <span>{property.bedrooms} Beds</span>
          <span>{property.bathrooms} Baths</span>
          <span>{property.area_sqft} sq.ft</span>
        </div>
      </div>
    </Link>
  );
}

export default Home;
