import api from "./api";

export const reviewApi = {
  getSummary: (propertyId) =>
    api.get(`/reviews/property/${propertyId}/summary/`),

  listReviews: (propertyId, page = 1) =>
    api.get(`/reviews/property/${propertyId}/`, {
      params: { page },
    }),

  createReview: (data) =>
    api.post("/reviews/add/", data),

  updateReview: (reviewId, data) =>
    api.patch(`/reviews/${reviewId}/`, data),

  deleteReview: (reviewId) =>
    api.delete(`/reviews/${reviewId}/`),
};

export function getReviewErrorMessage(error, fallback) {
  const data = error.response?.data;

  if (!data) {
    return fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  const messages = Object.values(data).flat().filter(
    (item) => typeof item === "string"
  );

  return messages.length > 0 ? messages.join(" ") : fallback;
}

export default reviewApi;
