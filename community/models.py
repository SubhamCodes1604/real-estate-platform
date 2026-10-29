
from django.conf import settings
from django.db import models


class Question(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="community_questions",
    )
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Answer(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="answers",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="community_answers",
        null=True,
        blank=True,
    )
    body = models.TextField()
    is_ai_generated = models.BooleanField(default=False)
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Answer to: {self.question.title}"


class AnswerVote(models.Model):
    LIKE = "LIKE"
    DISLIKE = "DISLIKE"

    VOTE_CHOICES = [
        (LIKE, "Like"),
        (DISLIKE, "Dislike"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="community_answer_votes",
    )
    answer = models.ForeignKey(
        Answer,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    vote = models.CharField(
        max_length=10,
        choices=VOTE_CHOICES,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "answer"],
                name="unique_user_answer_vote",
            ),
        ]

    def __str__(self):
        return f"{self.user} - {self.vote} - Answer {self.answer_id}"
