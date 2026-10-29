import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import PropertyCard from "../components/PropertyCard";
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
      } catch (err) {
        console.error("Bookmarks error:", err);

        setError(
          err.response?.data?.detail ||
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
          (bookmark) => bookmark.id !== bookmarkId
        )
      );
    } catch (err) {
      console.error("Remove bookmark error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to remove bookmark."
      );
    }
  };

  if (loading) {
    return (
      <div className="bookmarks-page">
        <div className="bookmarks-header">
          <h1>My Bookmarks</h1>
          <p>Properties you've saved for later.</p>
        </div>
        <div className="bookmarks-skeleton-grid">
          {[1, 2, 3].map((i) => (
            <div className="bookmarks-skeleton-card" key={i}>
              <div className="skeleton-image"></div>
              <div className="skeleton-body">
                <div className="skeleton-line skeleton-line-medium"></div>
                <div className="skeleton-line skeleton-line-short"></div>
                <div className="skeleton-line skeleton-line-long"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bookmarks-page">
        <div className="bookmarks-header">
          <h1>My Bookmarks</h1>
          <p>Properties you've saved for later.</p>
        </div>
        <div className="bookmarks-error-state">
          <h3>Unable to load bookmarks</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookmarks-page">
      <div className="bookmarks-header">
        <h1>My Bookmarks</h1>
        <p>Properties you've saved for later.</p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="bookmarks-empty">
          <h3>No bookmarks yet</h3>
          <p>You haven't bookmarked any properties yet.</p>
          <Link to="/properties" className="bookmarks-empty-button">
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="bookmarks-grid">
          {bookmarks.map((bookmark) => {
            const property = bookmark.property;
            if (!property) return null;

            return (
              <div
                className="bookmark-wrapper"
                key={bookmark.id}
              >
                <PropertyCard property={property} />
                <button
                  className="bookmark-remove-button"
                  onClick={() => removeBookmark(bookmark.id)}
                >
                  Remove Bookmark
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Bookmarks;
