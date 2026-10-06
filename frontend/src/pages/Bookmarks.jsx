import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Bookmarks.css";

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await api.get(
          "/bookmarks/list/"
        );

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setBookmarks(data);

      } catch (error) {
        console.error(
          "Bookmarks error:",
          error
        );

        setError(
          error.response?.data?.detail ||
          "Unable to load bookmarks."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  const removeBookmark = async (bookmarkId) => {
    try {
      await api.delete(
        `/bookmarks/remove/${bookmarkId}/`
      );

      setBookmarks((currentBookmarks) =>
        currentBookmarks.filter(
          (bookmark) =>
            bookmark.id !== bookmarkId
        )
      );

    } catch (error) {
      console.error(
        "Remove bookmark error:",
        error
      );

      setError(
        error.response?.data?.detail ||
        "Unable to remove bookmark."
      );
    }
  };

  if (loading) {
    return (
      <div className="bookmarks-page">
        <h1>My Bookmarks</h1>
        <p>Loading bookmarks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bookmarks-page">
        <h1>My Bookmarks</h1>

        <p className="bookmarks-error">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="bookmarks-page">

      <h1>My Bookmarks</h1>

      {bookmarks.length === 0 ? (
        <div className="empty-bookmarks">
          <p>
            You haven't bookmarked any properties yet.
          </p>

          <Link to="/properties">
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="bookmarks-grid">

          {bookmarks.map((bookmark) => {
            const property = bookmark.property;

            return (
              <div
                className="bookmark-card"
                key={bookmark.id}
              >

                {property?.image && (
                  <img
                    src={property.image}
                    alt={property.title}
                    className="bookmark-image"
                  />
                )}

                <div className="bookmark-content">

                  <h2>
                    {property?.title ||
                      "Property"}
                  </h2>

                  <p className="bookmark-price">
                    ₹ {property?.price}
                  </p>

                  <p>
                    {property?.city},{" "}
                    {property?.state}
                  </p>

                  <div className="bookmark-actions">

                    <Link
                      to={`/properties/${property?.id}`}
                      className="view-property-button"
                    >
                      View Property
                    </Link>

                    <button
                      className="remove-bookmark-button"
                      onClick={() =>
                        removeBookmark(bookmark.id)
                      }
                    >
                      Remove
                    </button>

                  </div>

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}

export default Bookmarks;