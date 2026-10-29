
import re

from django.db import transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
    IsAuthenticatedOrReadOnly,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from properties.models import Property
from .ai_service import generate_ai_answer
from .models import Answer, AnswerVote, Question
from .serializers import AnswerSerializer, QuestionSerializer
from django.db.models import Count, Prefetch, Q


class QuestionListCreateView(generics.ListCreateAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = (
            Question.objects.select_related("author")
            .annotate(
                answers_count=Count(
                    "answers",
                    filter=Q(answers__is_ai_generated=False),
                ),
                has_accepted_answer=Count(
                    "answers",
                    filter=Q(
                        answers__is_ai_generated=False,
                        answers__is_accepted=True,
                    ),
                ),
            )
            .prefetch_related("answers__author", "answers__votes")
        )

        search = self.request.query_params.get("search", "").strip()

        if search:
            keywords = search.split()

            for keyword in keywords:
                queryset = queryset.filter(
                    Q(title__icontains=keyword)
                    | Q(body__icontains=keyword)
                )

        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)



class QuestionDetailView(generics.RetrieveAPIView):
    queryset = (
        Question.objects.select_related("author")
        .annotate(
            answers_count=Count(
                "answers",
                filter=Q(answers__is_ai_generated=False),
            ),
            has_accepted_answer=Count(
                "answers",
                filter=Q(
                    answers__is_ai_generated=False,
                    answers__is_accepted=True,
                ),
            ),
        )
        .prefetch_related(
            Prefetch(
                "answers",
                queryset=Answer.objects.filter(
                    is_ai_generated=False
                ).select_related("author").prefetch_related("votes"),
                to_attr="community_answers",
            ),
        )
    )
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]




class AnswerCreateView(generics.ListCreateAPIView):
    serializer_class = AnswerSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        question = get_object_or_404(
            Question,
            pk=self.kwargs["question_id"],
        )

        return (
            Answer.objects.filter(
                question=question,
                is_ai_generated=False,
            )
            .select_related("author")
            .annotate(
                likes=Count(
                    "votes",
                    filter=Q(votes__vote=AnswerVote.LIKE),
                    distinct=True,
                ),
                dislikes=Count(
                    "votes",
                    filter=Q(votes__vote=AnswerVote.DISLIKE),
                    distinct=True,
                ),
            )
            .order_by("-is_accepted", "created_at")
        )

    def perform_create(self, serializer):
        question = get_object_or_404(
            Question,
            pk=self.kwargs["question_id"],
        )

        serializer.save(
            question=question,
            author=self.request.user,
            is_ai_generated=False,
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class AIAnswerView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, question_id):
        question = get_object_or_404(Question, pk=question_id)

        try:
            answer = generate_ai_answer(question)
        except Exception:
            return Response(
                {
                    "detail": (
                        "Unable to generate an AI answer. "
                        "Please try again later."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        likes = answer.votes.filter(
            vote=AnswerVote.LIKE
        ).count()
        dislikes = answer.votes.filter(
            vote=AnswerVote.DISLIKE
        ).count()

        user_vote = None
        if request.user.is_authenticated:
            user_vote = AnswerVote.objects.filter(
                answer=answer,
                user=request.user,
            ).values_list("vote", flat=True).first()

        return Response({
            "id": answer.id,
            "question": answer.question_id,
            "answer": answer.body,
            "is_ai_generated": answer.is_ai_generated,
            "created_at": answer.created_at,
            "likes": likes,
            "dislikes": dislikes,
            "user_vote": user_vote,
        })


class PropertySuggestionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, question_id):
        question = get_object_or_404(Question, pk=question_id)

        question_text = (
            f"{question.title} {question.body or ''}"
        ).lower()

        properties = Property.objects.filter(
            is_approved=True
        ).order_by("-is_featured", "-created_at")

        bedroom_match = re.search(
            r"\b(\d+)\s*(?:bhk|bedrooms?|beds?)\b",
            question_text,
        )

        if bedroom_match:
            properties = properties.filter(
                bedrooms=int(bedroom_match.group(1))
            )

        available_cities = (
            Property.objects.filter(is_approved=True)
            .values_list("city", flat=True)
            .distinct()
        )

        for city in available_cities:
            if city and re.search(
                rf"\b{re.escape(city.lower())}\b",
                question_text,
            ):
                properties = properties.filter(city__iexact=city)
                break

        results = []

        for prop in properties[:10]:
            image_url = None

            if prop.image:
                try:
                    image_url = request.build_absolute_uri(
                        prop.image.url
                    )
                except (ValueError, OSError):
                    image_url = None

            results.append({
                "id": prop.id,
                "title": prop.title,
                "price": str(prop.price),
                "city": prop.city,
                "state": prop.state,
                "image": image_url,
                "bedrooms": prop.bedrooms,
                "bathrooms": prop.bathrooms,
                "area_sqft": prop.area_sqft,
                "property_type": prop.property_type,
            })

        return Response({"results": results})



class AnswerVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, answer_id, vote_type):
        if vote_type not in ("like", "dislike"):
            return Response(
                {"detail": "Invalid vote type."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        answer = get_object_or_404(Answer, pk=answer_id)

        vote_value = (
            AnswerVote.LIKE
            if vote_type == "like"
            else AnswerVote.DISLIKE
        )

        with transaction.atomic():
            vote, created = AnswerVote.objects.get_or_create(
                user=request.user,
                answer=answer,
                defaults={"vote": vote_value},
            )

            if not created:
                if vote.vote == vote_value:
                    # Clicking the same button again removes the vote.
                    vote.delete()
                else:
                    # Switch the existing vote; do not create another.
                    vote.vote = vote_value
                    vote.save(update_fields=["vote", "updated_at"])

            current_vote = AnswerVote.objects.filter(
                user=request.user,
                answer=answer,
            ).values_list("vote", flat=True).first()

            likes = answer.votes.filter(
                vote=AnswerVote.LIKE
            ).count()

            dislikes = answer.votes.filter(
                vote=AnswerVote.DISLIKE
            ).count()

        return Response({
            "detail": "Vote updated.",
            "likes": likes,
            "dislikes": dislikes,
            "user_vote": current_vote,
        })



class AcceptAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, answer_id):
        answer = get_object_or_404(
            Answer.objects.select_related("question"),
            pk=answer_id,
        )

        if answer.is_ai_generated or answer.author_id is None:
            return Response(
                {"detail": "Only human answers can be accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if answer.question.author_id != request.user.id:
            return Response(
                {"detail": "Only the question owner can accept an answer."},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            Answer.objects.filter(
                question=answer.question,
                is_accepted=True,
            ).exclude(pk=answer.pk).update(is_accepted=False)

            answer.is_accepted = True
            answer.save(update_fields=["is_accepted", "updated_at"])

        return Response({
            "detail": "Answer accepted successfully.",
            "answer_id": answer.id,
            "is_accepted": True,
        })
