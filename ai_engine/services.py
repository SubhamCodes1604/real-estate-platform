import math
import re

import numpy as np

from properties.models import Property


# ==========================================
# BASIC ENGLISH STOP WORDS
# ==========================================

STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by",
    "for", "from", "has", "have", "he", "in", "is",
    "it", "its", "of", "on", "or", "that", "the",
    "this", "to", "was", "were", "will", "with",
    "you", "your", "our", "their", "they", "we",
    "but", "not", "can", "all", "any", "about",
    "into", "more", "than", "there", "these", "those"
}


# ==========================================
# TEXT TOKENIZATION
# ==========================================

def tokenize(text):
    words = re.findall(r"\b[a-zA-Z0-9]+\b", text.lower())

    return [
        word
        for word in words
        if word not in STOP_WORDS
    ]


# ==========================================
# TF-IDF
# ==========================================

def create_tfidf(documents):

    tokenized_documents = [
        tokenize(document)
        for document in documents
    ]

    vocabulary = {}

    for tokens in tokenized_documents:
        for token in tokens:
            if token not in vocabulary:
                vocabulary[token] = len(vocabulary)

    if not vocabulary:
        return np.zeros(
            (len(documents), 1),
            dtype=float
        )

    document_count = len(documents)
    vocabulary_size = len(vocabulary)

    tfidf = np.zeros(
        (document_count, vocabulary_size),
        dtype=float
    )

    # ==========================================
    # TERM FREQUENCY
    # ==========================================

    for document_index, tokens in enumerate(
        tokenized_documents
    ):

        if not tokens:
            continue

        term_counts = {}

        for token in tokens:
            term_counts[token] = (
                term_counts.get(token, 0) + 1
            )

        total_terms = len(tokens)

        for token, count in term_counts.items():

            word_index = vocabulary[token]

            tf = count / total_terms

            tfidf[
                document_index,
                word_index
            ] = tf

    # ==========================================
    # INVERSE DOCUMENT FREQUENCY
    # ==========================================

    for token, word_index in vocabulary.items():

        document_frequency = sum(
            1
            for tokens in tokenized_documents
            if token in tokens
        )

        idf = math.log(
            (1 + document_count)
            / (1 + document_frequency)
        ) + 1

        tfidf[:, word_index] *= idf

    # ==========================================
    # NORMALIZE VECTORS
    # ==========================================

    norms = np.linalg.norm(
        tfidf,
        axis=1,
        keepdims=True
    )

    norms[norms == 0] = 1

    tfidf = tfidf / norms

    return tfidf


# ==========================================
# COSINE SIMILARITY
# ==========================================

def cosine_similarity(vector, matrix):

    vector = np.asarray(
        vector,
        dtype=float
    )

    matrix = np.asarray(
        matrix,
        dtype=float
    )

    if vector.ndim == 1:
        vector = vector.reshape(1, -1)

    vector_norm = np.linalg.norm(
        vector,
        axis=1,
        keepdims=True
    )

    matrix_norm = np.linalg.norm(
        matrix,
        axis=1,
        keepdims=True
    )

    vector_norm[vector_norm == 0] = 1
    matrix_norm[matrix_norm == 0] = 1

    vector_normalized = (
        vector / vector_norm
    )

    matrix_normalized = (
        matrix / matrix_norm
    )

    return np.dot(
        vector_normalized,
        matrix_normalized.T
    )


# ==========================================
# GET PROPERTY TEXT
# ==========================================

def get_property_text(property_obj):

    return " ".join([
        property_obj.title or "",
        property_obj.description or "",
        property_obj.city or "",
        property_obj.state or "",
        property_obj.property_type or "",
    ])


# ==========================================
# SIMILAR PROPERTY RECOMMENDATIONS
# ==========================================

def get_similar_properties(
    property_id,
    limit=10
):

    properties = list(
        Property.objects.filter(
            is_approved=True
        )
    )

    if not properties:
        return []

    target_property = next(
        (
            property_obj
            for property_obj in properties
            if property_obj.id == property_id
        ),
        None
    )

    if not target_property:
        return []

    # ==========================================
    # 1. TEXT FEATURES
    # ==========================================

    documents = [
        get_property_text(property_obj)
        for property_obj in properties
    ]

    text_vectors = create_tfidf(
        documents
    )

    target_index = properties.index(
        target_property
    )

    text_similarity = cosine_similarity(
        text_vectors[target_index],
        text_vectors
    )[0]

    # ==========================================
    # 2. INDIVIDUAL FEATURE SIMILARITY
    # ==========================================

    target_price = float(
        target_property.price
    )

    target_area = float(
        target_property.area_sqft
    )

    target_bedrooms = float(
        target_property.bedrooms
    )

    target_bathrooms = float(
        target_property.bathrooms
    )

    price_scores = []
    area_scores = []
    bedroom_scores = []
    bathroom_scores = []
    location_scores = []

    for property_obj in properties:

        property_price = float(
            property_obj.price
        )

        property_area = float(
            property_obj.area_sqft
        )

        # Price similarity
        if max(
            target_price,
            property_price
        ) == 0:

            price_score = 1

        else:

            price_score = 1 - (
                abs(
                    target_price -
                    property_price
                )
                / max(
                    target_price,
                    property_price
                )
            )

        # Area similarity
        if max(
            target_area,
            property_area
        ) == 0:

            area_score = 1

        else:

            area_score = 1 - (
                abs(
                    target_area -
                    property_area
                )
                / max(
                    target_area,
                    property_area
                )
            )

        # Bedroom similarity
        bedroom_score = (
            1
            if target_bedrooms ==
            property_obj.bedrooms
            else 0
        )

        # Bathroom similarity
        bathroom_score = (
            1
            if target_bathrooms ==
            property_obj.bathrooms
            else 0
        )

        # Location + property type
        location_score = 0

        if (
            target_property.city.lower()
            == property_obj.city.lower()
        ):
            location_score += 0.5

        if (
            target_property.property_type
            == property_obj.property_type
        ):
            location_score += 0.5

        price_scores.append(
            max(price_score, 0)
        )

        area_scores.append(
            max(area_score, 0)
        )

        bedroom_scores.append(
            bedroom_score
        )

        bathroom_scores.append(
            bathroom_score
        )

        location_scores.append(
            location_score
        )

    # ==========================================
    # 3. WEIGHTED SCORE
    # ==========================================

    final_scores = []

    for index in range(
        len(properties)
    ):

        score = (
            text_similarity[index] * 0.30
            + price_scores[index] * 0.25
            + location_scores[index] * 0.20
            + bedroom_scores[index] * 0.10
            + bathroom_scores[index] * 0.05
            + area_scores[index] * 0.10
        )

        final_scores.append(
            float(score)
        )

    # ==========================================
    # 4. CREATE RECOMMENDATIONS
    # ==========================================

    recommendations = []

    for index, score in enumerate(
        final_scores
    ):

        if properties[index].id == property_id:
            continue

        if score < 0.20:
            continue

        recommendations.append({
            "property": properties[index],
            "score": score
        })

    # ==========================================
    # 5. SORT
    # ==========================================

    recommendations.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return recommendations[:limit]


# ==========================================
# PERSONALIZED RECOMMENDATIONS
# ==========================================

def get_personalized_recommendations(
    user,
    limit=10
):

    from bookmarks.models import Bookmark

    bookmarks = Bookmark.objects.filter(
        user=user
    ).select_related("property")

    if not bookmarks.exists():
        return []

    bookmarked_properties = [
        bookmark.property
        for bookmark in bookmarks
        if bookmark.property.is_approved
    ]

    if not bookmarked_properties:
        return []

    all_properties = list(
        Property.objects.filter(
            is_approved=True
        )
    )

    # ==========================================
    # BOOKMARKED PROPERTY IDS
    # ==========================================

    bookmarked_ids = {
        property_obj.id
        for property_obj in bookmarked_properties
    }

    # ==========================================
    # TEXT FEATURES
    # ==========================================

    documents = [
        get_property_text(property_obj)
        for property_obj in all_properties
    ]

    text_vectors = create_tfidf(
        documents
    )

    # ==========================================
    # BOOKMARK INDICES
    # ==========================================

    bookmarked_indices = []

    for property_obj in bookmarked_properties:

        for index, current_property in enumerate(
            all_properties
        ):

            if current_property.id == property_obj.id:

                bookmarked_indices.append(index)

                break

    if not bookmarked_indices:
        return []

    # ==========================================
    # USER TEXT PROFILE
    # ==========================================

    user_text_vector = np.mean(
        text_vectors[
            bookmarked_indices
        ],
        axis=0
    )

    # ==========================================
    # USER NUMERICAL PROFILE
    # ==========================================

    user_price = np.mean([
        float(
            all_properties[index].price
        )
        for index in bookmarked_indices
    ])

    user_bedrooms = np.mean([
        float(
            all_properties[index].bedrooms
        )
        for index in bookmarked_indices
    ])

    user_bathrooms = np.mean([
        float(
            all_properties[index].bathrooms
        )
        for index in bookmarked_indices
    ])

    user_area = np.mean([
        float(
            all_properties[index].area_sqft
        )
        for index in bookmarked_indices
    ])

    # ==========================================
    # TEXT SIMILARITY
    # ==========================================

    text_scores = cosine_similarity(
        user_text_vector,
        text_vectors
    )[0]

    # ==========================================
    # NUMERICAL SIMILARITY
    # ==========================================

    numerical_scores = []

    for property_obj in all_properties:

        property_price = float(
            property_obj.price
        )

        property_bedrooms = float(
            property_obj.bedrooms
        )

        property_bathrooms = float(
            property_obj.bathrooms
        )

        property_area = float(
            property_obj.area_sqft
        )

        # Price
        if max(
            user_price,
            property_price
        ) == 0:

            price_similarity = 1

        else:

            price_similarity = 1 - (
                abs(
                    user_price -
                    property_price
                )
                / max(
                    user_price,
                    property_price
                )
            )

        # Area
        if max(
            user_area,
            property_area
        ) == 0:

            area_similarity = 1

        else:

            area_similarity = 1 - (
                abs(
                    user_area -
                    property_area
                )
                / max(
                    user_area,
                    property_area
                )
            )

        # Bedrooms
        if max(
            user_bedrooms,
            property_bedrooms
        ) == 0:

            bedroom_similarity = 1

        else:

            bedroom_similarity = 1 - (
                abs(
                    user_bedrooms -
                    property_bedrooms
                )
                / max(
                    user_bedrooms,
                    property_bedrooms
                )
            )

        # Bathrooms
        if max(
            user_bathrooms,
            property_bathrooms
        ) == 0:

            bathroom_similarity = 1

        else:

            bathroom_similarity = 1 - (
                abs(
                    user_bathrooms -
                    property_bathrooms
                )
                / max(
                    user_bathrooms,
                    property_bathrooms
                )
            )

        numerical_score = (
            price_similarity * 0.40
            + area_similarity * 0.30
            + bedroom_similarity * 0.20
            + bathroom_similarity * 0.10
        )

        numerical_scores.append(
            max(
                float(numerical_score),
                0
            )
        )

    # ==========================================
    # FINAL PERSONALIZED SCORE
    # ==========================================

    recommendations = []

    for index, property_obj in enumerate(
        all_properties
    ):

        if property_obj.id in bookmarked_ids:
            continue

        text_score = max(
            float(text_scores[index]),
            0
        )

        numerical_score = max(
            float(numerical_scores[index]),
            0
        )

        # 60% text + 40% numerical
        score = (
            text_score * 0.60
            + numerical_score * 0.40
        )

        if score < 0.25:
            continue

        recommendations.append({
            "property": property_obj,
            "score": round(
                score,
                4
            ),
            "text_score": round(
                text_score,
                4
            ),
            "numerical_score": round(
                numerical_score,
                4
            )
        })

    # ==========================================
    # SORT
    # ==========================================

    recommendations.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return recommendations[:limit]