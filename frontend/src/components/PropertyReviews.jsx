import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  reviewApi,
  getReviewErrorMessage,
} from "../services/reviewApi";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";
import ReviewSummary from "./ReviewSummary";
import "./PropertyReviews.css";

async function fetchSummary(propertyId) {
  const response = await reviewApi.getSummary(propertyId);

  if (typeof response.data?.total_reviews !== "number") {
    throw new Error("Unexpected rating summary response");
  }

  return response.data;
}

async function fetchReviewPage(propertyId, page) {
  const response = await reviewApi.listReviews(propertyId, page);

  if (!Array.isArray(response.data?.results)) {
    throw new Error("Unexpected reviews response");
  }

  return response.data;
}

function PropertyReviews({ propertyId }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");

  const [reviews, setReviews] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  // null = closed, "create" = new review, object = review being edited
  const [formMode, setFormMode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const editingReview =
    formMode && formMode !== "create" ? formMode : null;

  useEffect(() => {
    let ignore = false;

    fetchSummary(propertyId)
      .then((data) => {
        if (!ignore) {
          setSummary(data);
          setSummaryError("");
        }
      })
      .catch((err) => {
        console.error("Review summary error:", err);

        if (!ignore) {
          setSummaryError("Unable to load ratings.");
        }
      });

    fetchReviewPage(propertyId, 1)
      .then((data) => {
        if (!ignore) {
          setReviews(data.results);
          setNextPage(data.next ? 2 : null);
          setReviewsError("");
        }
      })
      .catch((err) => {
        console.error("Reviews load error:", err);

        if (!ignore) {
          setReviewsError("Unable to load reviews.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setReviewsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [propertyId]);

  const loadSummary = async () => {
    try {
      setSummary(await fetchSummary(propertyId));
      setSummaryError("");
    } catch (err) {
      console.error("Review summary error:", err);
      setSummaryError("Unable to load ratings.");
    }
  };

  const loadReviews = async () => {
    try {
      const data = await fetchReviewPage(propertyId, 1);

      setReviews(data.results);
      setNextPage(data.next ? 2 : null);
      setReviewsError("");
    } catch (err) {
      console.error("Reviews load error:", err);
      setReviewsError("Unable to load reviews.");
    } finally {
      setReviewsLoading(false);
    }
  };

  const retryReviews = () => {
    setReviewsLoading(true);
    loadReviews();
  };

  const loadMoreReviews = async () => {
    if (!nextPage) {
      return;
    }

    setLoadingMore(true);

    try {
      const data = await fetchReviewPage(propertyId, nextPage);

      setReviews((previous) => [...previous, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      console.error("Load more reviews error:", err);
      setFeedback({ type: "error", text: "Unable to load more reviews." });
    } finally {
      setLoadingMore(false);
    }
  };

  const refreshReviews = () => Promise.all([loadSummary(), loadReviews()]);

  const closeForm = () => {
    setFormMode(null);
    setFormError("");
  };

  const handleEdit = (review) => {
    setFormMode(review);
    setFormError("");
    setFeedback(null);
  };

  const handleCreate = async (values) => {
    setSubmitting(true);
    setFormError("");

    try {
      await reviewApi.createReview({ property: propertyId, ...values });

      closeForm();
      setFeedback({ type: "success", text: "Your review has been posted." });
      await refreshReviews();
    } catch (err) {
      setFormError(getReviewErrorMessage(err, "Unable to post your review."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (values) => {
    setSubmitting(true);
    setFormError("");

    try {
      await reviewApi.updateReview(editingReview.id, values);

      closeForm();
      setFeedback({ type: "success", text: "Your review has been updated." });
      await refreshReviews();
    } catch (err) {
      setFormError(getReviewErrorMessage(err, "Unable to update your review."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = (values) =>
    editingReview ? handleUpdate(values) : handleCreate(values);

  const handleDelete = async (review) => {
    if (!window.confirm("Delete your review? This cannot be undone.")) {
      return;
    }

    setDeletingId(review.id);
    setFeedback(null);

    try {
      await reviewApi.deleteReview(review.id);

      if (editingReview?.id === review.id) {
        closeForm();
      }

      setFeedback({ type: "success", text: "Your review has been deleted." });
      await refreshReviews();
    } catch (err) {
      setFeedback({
        type: "error",
        text: getReviewErrorMessage(err, "Unable to delete your review."),
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="property-reviews" aria-labelledby="property-reviews-heading">

      <div className="property-reviews-header">
        <h2 id="property-reviews-heading">Property Reviews</h2>

        {isAuthenticated && formMode === null && (
          <button
            type="button"
            className="review-button review-button--primary"
            onClick={() => {
              setFormMode("create");
              setFeedback(null);
            }}
          >
            Write a review
          </button>
        )}
      </div>

      {feedback && (
        <p
          role="status"
          className={`review-feedback review-feedback--${feedback.type}`}
        >
          {feedback.text}
        </p>
      )}

      {summaryError && (
        <div className="review-error" role="alert">
          <p>{summaryError}</p>
          <button type="button" className="review-button" onClick={loadSummary}>
            Try again
          </button>
        </div>
      )}

      {summary && <ReviewSummary summary={summary} />}

      {!summary && !summaryError && (
        <p className="review-muted">Loading ratings...</p>
      )}

      {!authLoading && !isAuthenticated && (
        <p className="review-login-prompt">
          <Link to="/login">Log in</Link> to write a review for this property.
        </p>
      )}

      {isAuthenticated && formMode !== null && (
        <div className="review-form-panel">
          <h3>{editingReview ? "Edit your review" : "Write a review"}</h3>

          <ReviewForm
            key={editingReview?.id ?? "new"}
            initialReview={editingReview}
            onSubmit={handleFormSubmit}
            onCancel={closeForm}
            submitting={submitting}
            error={formError}
            submitLabel={editingReview ? "Save changes" : "Post review"}
          />
        </div>
      )}

      {reviewsLoading && (
        <p className="review-muted">Loading reviews...</p>
      )}

      {!reviewsLoading && reviewsError && (
        <div className="review-error" role="alert">
          <p>{reviewsError}</p>
          <button type="button" className="review-button" onClick={retryReviews}>
            Try again
          </button>
        </div>
      )}

      {!reviewsLoading && !reviewsError && reviews.length === 0 && (
        <p className="review-muted">
          No reviews yet. Be the first to share your experience.
        </p>
      )}

      {!reviewsLoading && reviews.length > 0 && (
        <ReviewList
          reviews={reviews}
          currentUserId={user?.id}
          deletingId={deletingId}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {nextPage && (
        <div className="property-reviews-more">
          <button
            type="button"
            className="review-button"
            onClick={loadMoreReviews}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load more reviews"}
          </button>
        </div>
      )}

    </section>
  );
}

export default PropertyReviews;
