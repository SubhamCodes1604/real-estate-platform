import api from "./api";

export const reviewApi = {
  listReviews: (propertyId) =>
    api.get(`/reviews/property/${propertyId}/`),

  getAverage: (propertyId) =>
    api.get(`/reviews/property/${propertyId}/average/`),

  createReview: (data) =>
    api.post("/reviews/add/", data),

  updateReview: (reviewId, data) =>
    api.patch(`/reviews/${reviewId}/`, data),

  deleteReview: (reviewId) =>
    api.delete(`/reviews/${reviewId}/`),

  listRecent: () =>
    api.get("/reviews/recent/"),
};

export default reviewApi;
