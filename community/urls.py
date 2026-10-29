
from django.urls import path

from .views import (
    QuestionListCreateView,
    QuestionDetailView,
    AnswerCreateView,
    AIAnswerView,
    AnswerVoteView,
    AcceptAnswerView,
)
from .views import PropertySuggestionsView


urlpatterns = [
    path(
        "questions/",
        QuestionListCreateView.as_view(),
        name="question-list-create",
    ),
    path(
        "questions/<int:pk>/",
        QuestionDetailView.as_view(),
        name="question-detail",
    ),
    path(
        "questions/<int:question_id>/answers/",
        AnswerCreateView.as_view(),
        name="answer-list-create",
    ),
    path(
        "questions/<int:question_id>/ai-answer/",
        AIAnswerView.as_view(),
        name="ai-answer",
    ),
    path(
        "questions/<int:question_id>/suggestions/",
        PropertySuggestionsView.as_view(),
        name="property-suggestions",
    ),
    path(
        "answers/<int:answer_id>/like/",
        AnswerVoteView.as_view(),
        {"vote_type": "like"},
        name="answer-like",
    ),
    path(
        "answers/<int:answer_id>/dislike/",
        AnswerVoteView.as_view(),
        {"vote_type": "dislike"},
        name="answer-dislike",
    ),
    path(
        "answers/<int:answer_id>/accept/",
        AcceptAnswerView.as_view(),
        name="answer-accept",
    ),
]
