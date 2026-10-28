import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import qaApi from "../services/qaApi";
import "./QuestionDetails.css";

function QuestionDetails() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [aiAnswer, setAiAnswer] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState("");

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] =
    useState(true);
  const [suggestionsError, setSuggestionsError] = useState("");

  const [answerBody, setAnswerBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [answerFormError, setAnswerFormError] = useState("");
  const [answerFormSuccess, setAnswerFormSuccess] = useState("");

  const [actionError, setActionError] = useState("");

  const isQuestionOwner =
    user &&
    question &&
    (user.id === question.author ||
      user.id === question.author_id ||
      user.username === question.author_username);

  // =========================
  // FETCH QUESTION
  // =========================

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await qaApi.getQuestion(id);
        setQuestion(response.data);
      } catch (err) {
        console.error("Question detail error:", err);

        setError(
          err.response?.data?.detail ||
            "Unable to load this question. The Q&A backend may not be available yet."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id]);

  // =========================
  // FETCH ANSWERS
  // =========================

  useEffect(() => {
    const fetchAnswers = async () => {
      try {
        const response = await qaApi.listAnswers(id);

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setAnswers(data);
      } catch (err) {
        console.error("Answers error:", err);
        // Non-fatal: leave answers empty
      }
    };

    if (!loading && !error) {
      fetchAnswers();
    }
  }, [id, loading, error]);

  // =========================
  // FETCH AI ANSWER
  // =========================

  useEffect(() => {
    const fetchAiAnswer = async () => {
      try {
        setAiLoading(true);
        setAiError("");

        const response = await qaApi.getAiAnswer(id);
        setAiAnswer(response.data);
      } catch (err) {
        console.error("AI answer error:", err);

        setAiError(
          err.response?.data?.detail ||
            "AI answer is not available right now."
        );
      } finally {
        setAiLoading(false);
      }
    };

    if (!loading && !error) {
      fetchAiAnswer();
    }
  }, [id, loading, error]);

  // =========================
  // FETCH PROPERTY SUGGESTIONS
  // =========================

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setSuggestionsLoading(true);
        setSuggestionsError("");

        const response = await qaApi.getPropertySuggestions(id);

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || response.data.suggestions || [];

        setSuggestions(data);
      } catch (err) {
        console.error("Suggestions error:", err);

        setSuggestionsError(
          "Unable to load property suggestions."
        );
      } finally {
        setSuggestionsLoading(false);
      }
    };

    if (!loading && !error) {
      fetchSuggestions();
    }
  }, [id, loading, error]);

  // =========================
  // SUBMIT ANSWER
  // =========================

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    setAnswerFormError("");
    setAnswerFormSuccess("");

    if (!answerBody.trim()) {
      setAnswerFormError("Please write your answer.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await qaApi.createAnswer(id, {
        body: answerBody.trim(),
      });

      const newAnswer = response.data;

      setAnswers((prev) =>
        newAnswer ? [...prev, newAnswer] : prev
      );

      setAnswerBody("");
      setAnswerFormSuccess("Answer posted successfully!");
    } catch (err) {
      console.error("Submit answer error:", err);

      setAnswerFormError(
        err.response?.data?.detail ||
          "Unable to post your answer. The Q&A backend may not be available yet."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // LIKE / DISLIKE
  // =========================

  const handleVote = async (answerId, voteType) => {
    setActionError("");

    try {
      if (voteType === "like") {
        await qaApi.likeAnswer(answerId);
      } else {
        await qaApi.dislikeAnswer(answerId);
      }

      setAnswers((prev) =>
        prev.map((a) =>
          a.id === answerId
            ? {
                ...a,
                likes: voteType === "like" ? (a.likes || 0) + 1 : a.likes || 0,
                dislikes:
                  voteType === "dislike"
                    ? (a.dislikes || 0) + 1
                    : a.dislikes || 0,
                user_vote: voteType,
              }
            : a
        )
      );
    } catch (err) {
      console.error("Vote error:", err);

      setActionError(
        err.response?.data?.detail ||
          "Unable to register your vote right now."
      );
    }
  };

  // =========================
  // ACCEPT ANSWER
  // =========================

  const handleAccept = async (answerId) => {
    setActionError("");

    try {
      await qaApi.acceptAnswer(answerId);

      setAnswers((prev) =>
        prev.map((a) => ({
          ...a,
          is_accepted: a.id === answerId,
        }))
      );
    } catch (err) {
      console.error("Accept error:", err);

      setActionError(
        err.response?.data?.detail ||
          "Unable to accept this answer right now."
      );
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="question-details-page">
        <h1>Loading question...</h1>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <div className="question-details-page">
        <h1>Question Details</h1>
        <p className="qa-error-message">{error}</p>
        <Link to="/questions" className="qa-back-link">
          ← Back to Questions
        </Link>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="question-details-page">
        <h1>Question not found</h1>
        <Link to="/questions" className="qa-back-link">
          ← Back to Questions
        </Link>
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="question-details-page">
      <div className="question-details-container">
        {/* ========================= */}
        {/* BACK LINK */}
        {/* ========================= */}

        <Link to="/questions" className="qa-back-link">
          ← Back to Questions
        </Link>

        {/* ========================= */}
        {/* QUESTION HEADER */}
        {/* ========================= */}

        <div className="question-header">
          <h1>{question.title}</h1>

          <div className="question-meta-row">
            <span>
              Asked by{" "}
              {question.author_username ||
                question.author?.username ||
                "Anonymous"}
            </span>

            {question.created_at && (
              <span className="question-date">
                {new Date(question.created_at).toLocaleDateString()}
              </span>
            )}
          </div>

          {question.body && (
            <p className="question-body">{question.body}</p>
          )}
        </div>

        {/* ========================= */}
        {/* AI ANSWER */}
        {/* ========================= */}

        <section className="ai-answer-section">
          <h2>AI-Generated Answer</h2>

          {aiLoading && (
            <p className="qa-loading-text">
              Generating an AI answer...
            </p>
          )}

          {aiError && (
            <p className="qa-error-message">{aiError}</p>
          )}

          {!aiLoading && !aiError && aiAnswer && (
            <div className="ai-answer-box">
              {aiAnswer.answer ? (
                <p>{aiAnswer.answer}</p>
              ) : (
                <p>{aiAnswer}</p>
              )}
            </div>
          )}

          {!aiLoading && !aiError && !aiAnswer && (
            <p className="qa-loading-text">
              No AI answer available for this question.
            </p>
          )}
        </section>

        {/* ========================= */}
        {/* COMMUNITY ANSWERS */}
        {/* ========================= */}

        <section className="community-answers-section">
          <h2>
            Community Answers{" "}
            {answers.length > 0 && `(${answers.length})`}
          </h2>

          {actionError && (
            <p className="qa-error-message">{actionError}</p>
          )}

          {answers.length === 0 ? (
            <p className="qa-empty-text">
              No community answers yet. Be the first to answer!
            </p>
          ) : (
            <div className="answers-list">
              {answers.map((answer) => (
                <div
                  className={`answer-card${
                    answer.is_accepted ? " accepted" : ""
                  }`}
                  key={answer.id}
                >
                  {answer.is_accepted && (
                    <span className="accepted-indicator">
                      Accepted Answer
                    </span>
                  )}

                  <div className="answer-author">
                    <strong>
                      {answer.author_username ||
                        answer.author?.username ||
                        "Anonymous"}
                    </strong>

                    {answer.author_role && (
                      <span className="answer-role-badge">
                        {answer.author_role}
                      </span>
                    )}
                  </div>

                  <p className="answer-body">{answer.body}</p>

                  <div className="answer-actions">
                    <div className="vote-controls">
                      <button
                        className={`vote-button${
                          answer.user_vote === "like"
                            ? " active"
                            : ""
                        }`}
                        onClick={() =>
                          handleVote(answer.id, "like")
                        }
                        disabled={!isAuthenticated}
                        title="Like this answer"
                      >
                        ▲ {answer.likes || 0}
                      </button>

                      <button
                        className={`vote-button${
                          answer.user_vote === "dislike"
                            ? " active"
                            : ""
                        }`}
                        onClick={() =>
                          handleVote(answer.id, "dislike")
                        }
                        disabled={!isAuthenticated}
                        title="Dislike this answer"
                      >
                        ▼ {answer.dislikes || 0}
                      </button>
                    </div>

                    {isQuestionOwner &&
                      !answer.is_accepted && (
                        <button
                          className="accept-button"
                          onClick={() =>
                            handleAccept(answer.id)
                          }
                        >
                          Accept
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ========================= */}
        {/* ANSWER FORM */}
        {/* ========================= */}

        {isAuthenticated ? (
          <section className="answer-form-section">
            <h2>Your Answer</h2>

            {answerFormError && (
              <p className="qa-error-message">
                {answerFormError}
              </p>
            )}

            {answerFormSuccess && (
              <p className="qa-success-message">
                {answerFormSuccess}
              </p>
            )}

            <form onSubmit={handleSubmitAnswer}>
              <div className="form-group">
                <textarea
                  value={answerBody}
                  onChange={(e) =>
                    setAnswerBody(e.target.value)
                  }
                  placeholder="Share your knowledge, experience, or advice..."
                  rows="6"
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-answer-button"
                disabled={submitting}
              >
                {submitting ? "Posting..." : "Post Answer"}
              </button>
            </form>
          </section>
        ) : (
          <div className="qa-login-prompt">
            <p>
              Want to answer this question or vote on answers?
            </p>
            <Link to="/login">Login to participate</Link>
          </div>
        )}

        {/* ========================= */}
        {/* PROPERTY SUGGESTIONS */}
        {/* ========================= */}

        <section className="suggestions-section">
          <h2>Relevant Property Suggestions</h2>

          {suggestionsLoading && (
            <p className="qa-loading-text">
              Finding relevant properties...
            </p>
          )}

          {suggestionsError && (
            <p className="qa-error-message">
              {suggestionsError}
            </p>
          )}

          {!suggestionsLoading &&
            !suggestionsError &&
            suggestions.length === 0 && (
              <p className="qa-empty-text">
                No property suggestions available for this question.
              </p>
            )}

          {!suggestionsLoading &&
            !suggestionsError &&
            suggestions.length > 0 && (
              <div className="suggestions-grid">
                {suggestions.map((property) => (
                  <div
                    className="suggestion-card"
                    key={property.id}
                  >
                    {property.image ? (
                      <img
                        src={property.image}
                        alt={property.title}
                        className="suggestion-image"
                      />
                    ) : (
                      <div className="suggestion-no-image">
                        No Image
                      </div>
                    )}

                    <div className="suggestion-content">
                      <h3>{property.title}</h3>

                      <p className="suggestion-price">
                        ₹ {property.price}
                      </p>

                      <p className="suggestion-location">
                        {property.city}, {property.state}
                      </p>

                      <Link
                        to={`/properties/${property.id}`}
                        className="view-suggestion-button"
                      >
                        View Property
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>
      </div>
    </div>
  );
}

export default QuestionDetails;
