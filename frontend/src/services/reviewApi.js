
import api from "./api";

// Create a review
export const createReview = async (propertyId, reviewData) => {
  const response = await api.post("/reviews/add/", {
    property: propertyId,
    rating: reviewData.rating,
    comment: reviewData.comment,
  });

  return response.data;
};

// Get reviews for a property
export const getPropertyReviews = async (propertyId, page = 1) => {
  const response = await api.get(
    `/reviews/property/${propertyId}/`,
    {
      params: { page },
    }
  );

  return response.data;
};

// Get rating summary
export const getReviewSummary = async (propertyId) => {
  const response = await api.get(
    `/reviews/property/${propertyId}/average/`
  );

  return response.data;
};

// Get current user's review and owner status
export const getMyPropertyReview = async (propertyId) => {
  const response = await api.get(
    `/reviews/property/${propertyId}/my-review/`
  );

  return response.data;
};

// Edit an existing review
export const updateReview = async (reviewId, reviewData) => {
  const response = await api.patch(
    `/reviews/${reviewId}/`,
    reviewData
  );

  return response.data;
};

// Delete a review
export const deleteReview = async (reviewId) => {
  const response = await api.delete(
    `/reviews/${reviewId}/`
  );

  return response.data;
};

// Get recent reviews
export const getRecentReviews = async () => {
  const response = await api.get("/reviews/recent/");
  return response.data;
};
