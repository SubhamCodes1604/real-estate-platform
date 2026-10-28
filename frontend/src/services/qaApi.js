import api from "./api";

// ============================================================
// Q&A API SERVICE — ISOLATED, PENDING BACKEND IMPLEMENTATION
// ============================================================
// The backend `community` app currently has no endpoints.
// Every function below targets the expected `api/community/`
// routes. Until those endpoints are implemented on the Django
// side, calls will return a network/404 error that the UI
// surfaces via its error state.
//
// TODO(backend): implement the following DRF endpoints:
//   GET    /community/questions/            -> list + ?search=
//   POST   /community/questions/            -> create question
//   GET    /community/questions/:id/        -> question detail
//   POST   /community/questions/:id/answers/           -> submit answer
//   POST   /community/answers/:id/like/     -> like answer
//   POST   /community/answers/:id/dislike/  -> dislike answer
//   POST   /community/answers/:id/accept/   -> accept answer (question owner only)
//   GET    /community/questions/:id/suggestions/        -> property suggestions
//   GET    /community/questions/:id/ai-answer/          -> AI-generated answer
// ============================================================

export const qaApi = {
  // TODO(backend): GET /community/questions/?search=
  listQuestions: (search = "") =>
    api.get("/community/questions/", {
      params: search ? { search } : {},
    }),

  // TODO(backend): POST /community/questions/
  createQuestion: (data) =>
    api.post("/community/questions/", data),

  // TODO(backend): GET /community/questions/:id/
  getQuestion: (id) =>
    api.get(`/community/questions/${id}/`),

  // TODO(backend): GET /community/questions/:id/answers/
  listAnswers: (questionId) =>
    api.get(`/community/questions/${questionId}/answers/`),

  // TODO(backend): POST /community/questions/:id/answers/
  createAnswer: (questionId, data) =>
    api.post(`/community/questions/${questionId}/answers/`, data),

  // TODO(backend): POST /community/answers/:id/like/
  likeAnswer: (answerId) =>
    api.post(`/community/answers/${answerId}/like/`),

  // TODO(backend): POST /community/answers/:id/dislike/
  dislikeAnswer: (answerId) =>
    api.post(`/community/answers/${answerId}/dislike/`),

  // TODO(backend): POST /community/answers/:id/accept/
  acceptAnswer: (answerId) =>
    api.post(`/community/answers/${answerId}/accept/`),

  // TODO(backend): GET /community/questions/:id/suggestions/
  getPropertySuggestions: (questionId) =>
    api.get(`/community/questions/${questionId}/suggestions/`),

  // TODO(backend): GET /community/questions/:id/ai-answer/
  getAiAnswer: (questionId) =>
    api.get(`/community/questions/${questionId}/ai-answer/`),
};

export default qaApi;
