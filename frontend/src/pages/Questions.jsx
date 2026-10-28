import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import qaApi from "../services/qaApi";
import "./Questions.css";

function Questions() {
  const { isAuthenticated, user } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await qaApi.listQuestions(search);

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setQuestions(data);
      } catch (err) {
        console.error("Questions error:", err);

        setError(
          err.response?.data?.detail ||
            "Unable to load questions. The Q&A backend may not be available yet."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!title.trim()) {
      setFormError("Please enter a question title.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await qaApi.createQuestion({
        title: title.trim(),
        body: body.trim(),
      });

      const newQuestion = response.data;

      setQuestions((prev) =>
        newQuestion ? [newQuestion, ...prev] : prev
      );

      setTitle("");
      setBody("");
      setShowForm(false);
      setFormSuccess("Question posted successfully!");
    } catch (err) {
      console.error("Create question error:", err);

      setFormError(
        err.response?.data?.detail ||
          "Unable to post your question. The Q&A backend may not be available yet."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="questions-page">
      <div className="questions-header">
        <div>
          <h1>Questions & Answers</h1>
          <p>
            Ask questions about properties, neighborhoods, and the
            buying process.
          </p>
        </div>

        {isAuthenticated && (
          <button
            className="ask-question-button"
            onClick={() => {
              setShowForm((prev) => !prev);
              setFormError("");
              setFormSuccess("");
            }}
          >
            {showForm ? "Cancel" : "Ask a Question"}
          </button>
        )}
      </div>

      {/* ========================= */}
      {/* SEARCH */}
      {/* ========================= */}

      <form
        className="questions-search"
        onSubmit={handleSearch}
      >
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search questions..."
        />

        <button type="submit">Search</button>

        {search && (
          <button
            type="button"
            className="clear-search-button"
            onClick={() => {
              setSearchInput("");
              setSearch("");
            }}
          >
            Clear
          </button>
        )}
      </form>

      {/* ========================= */}
      {/* POST QUESTION FORM */}
      {/* ========================= */}

      {showForm && (
        <form
          className="question-form"
          onSubmit={handleSubmit}
        >
          <h2>Ask a Question</h2>

          {formError && (
            <p className="qa-error-message">{formError}</p>
          )}

          {formSuccess && (
            <p className="qa-success-message">{formSuccess}</p>
          )}

          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is your question?"
              required
            />
          </div>

          <div className="form-group">
            <label>Details (optional)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add more context about your question..."
              rows="5"
            />
          </div>

          <button
            type="submit"
            className="submit-question-button"
            disabled={submitting}
          >
            {submitting ? "Posting..." : "Post Question"}
          </button>
        </form>
      )}

      {/* ========================= */}
      {/* LOGIN PROMPT */}
      {/* ========================= */}

      {!isAuthenticated && (
        <div className="qa-login-prompt">
          <p>
            Want to ask a question or share your knowledge?
          </p>
          <Link to="/login">Login to participate</Link>
        </div>
      )}

      {/* ========================= */}
      {/* LOADING */}
      {/* ========================= */}

      {loading && (
        <p className="questions-loading">
          Loading questions...
        </p>
      )}

      {/* ========================= */}
      {/* ERROR */}
      {/* ========================= */}

      {!loading && error && (
        <div className="questions-error-box">
          <p>{error}</p>
        </div>
      )}

      {/* ========================= */}
      {/* EMPTY */}
      {/* ========================= */}

      {!loading && !error && questions.length === 0 && (
        <div className="empty-questions">
          <h2>No questions yet</h2>
          <p>
            {search
              ? "No questions match your search. Try a different term."
              : "Be the first to ask a question!"}
          </p>
          {isAuthenticated && !showForm && (
            <button
              className="ask-question-button"
              onClick={() => setShowForm(true)}
            >
              Ask a Question
            </button>
          )}
        </div>
      )}

      {/* ========================= */}
      {/* QUESTIONS LIST */}
      {/* ========================= */}

      {!loading && !error && questions.length > 0 && (
        <div className="questions-list">
          {questions.map((question) => (
            <Link
              to={`/questions/${question.id}`}
              className="question-card"
              key={question.id}
            >
              <div className="question-card-top">
                <h2>{question.title}</h2>
                <span className="question-date">
                  {question.created_at
                    ? new Date(
                        question.created_at
                      ).toLocaleDateString()
                    : ""}
                </span>
              </div>

              {question.body && (
                <p className="question-excerpt">
                  {question.body.length > 160
                    ? question.body.slice(0, 160) + "..."
                    : question.body}
                </p>
              )}

              <div className="question-meta">
                <span>
                  Asked by{" "}
                  {question.author_username ||
                    question.author?.username ||
                    "Anonymous"}
                </span>

                {question.answers_count !== undefined && (
                  <span>
                    {question.answers_count} answer
                    {question.answers_count === 1 ? "" : "s"}
                  </span>
                )}

                {question.has_accepted_answer && (
                  <span className="accepted-badge">
                    Answered
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ========================= */}
      {/* SHOW CURRENT USER HINT */}
      {/* ========================= */}

      {isAuthenticated && user && !loading && !error && (
        <p className="questions-user-hint">
          Logged in as {user.username} — your contributions
          will be attributed to your account.
        </p>
      )}
    </div>
  );
}

export default Questions;
