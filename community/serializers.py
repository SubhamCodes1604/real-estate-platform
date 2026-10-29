
from rest_framework import serializers
from .models import Answer, AnswerVote, Question


class AnswerSerializer(serializers.ModelSerializer):
    question = serializers.PrimaryKeyRelatedField(read_only=True)
    author_username = serializers.CharField(
        source="author.username",
        read_only=True,
        default=None,
    )
    likes = serializers.SerializerMethodField()
    dislikes = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Answer
        fields = [
            "id",
            "question",
            "author",
            "author_username",
            "body",
            "is_ai_generated",
            "is_accepted",
            "created_at",
            "likes",
            "dislikes",
            "user_vote",
        ]
        read_only_fields = [
            "id",
            "question",
            "author",
            "author_username",
            "is_ai_generated",
            "is_accepted",
            "created_at",
            "likes",
            "dislikes",
            "user_vote",
        ]

    def get_likes(self, obj):
        if hasattr(obj, "likes"):
            return obj.likes
        return obj.votes.filter(vote=AnswerVote.LIKE).count()

    def get_dislikes(self, obj):
        if hasattr(obj, "dislikes"):
            return obj.dislikes
        return obj.votes.filter(vote=AnswerVote.DISLIKE).count()

    def get_user_vote(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return None

        return AnswerVote.objects.filter(
            answer=obj,
            user=request.user,
        ).values_list("vote", flat=True).first()



class QuestionSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(
        source="author.username",
        read_only=True,
    )
    answers = AnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = [
            "id",
            "title",
            "body",
            "author",
            "author_username",
            "answers",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author",
            "author_username",
            "answers",
            "created_at",
            "updated_at",
        ]
