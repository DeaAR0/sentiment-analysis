"""
classify.py

Two-model HuggingFace classification pipeline for brand mention analysis.

Model 1 — Sentiment:
    cardiffnlp/twitter-roberta-base-sentiment-latest
    RoBERTa-base fine-tuned on 124M tweets (TweetEval benchmark)
    Labels: Negative / Neutral / Positive with softmax probabilities

Model 2 — Topics:
    facebook/bart-large-mnli  (zero-shot classification)
    BART fine-tuned on Multi-Genre NLI, used for zero-shot topic tagging
    No topic-specific training needed — labels are plain English

Both models run locally. Downloaded once (~500MB + ~1.6GB), cached by HuggingFace.
No API key or internet connection required after first run.

Sources:
    https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment-latest
    https://huggingface.co/facebook/bart-large-mnli

Usage:
    python classify.py
    python classify.py --input ../data/mentions_raw.csv --output ../data/mentions_classified.json
    python classify.py --batch 10    # test on first 10 rows only

Deployment notes:
    All tunable parameters live in CONFIG below.
    To swap models or adjust thresholds, edit CONFIG only — no logic changes needed.
"""

import csv
import json
import argparse
import re
from pathlib import Path

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    pipeline,
)
from scipy.special import softmax

# ---------------------------------------------------------------------------
# CONFIG — adjust for deployment without touching model logic
# ---------------------------------------------------------------------------
CONFIG = {
    # Model 1: Sentiment classifier (Twitter-domain RoBERTa)
    "sentiment_model": "cardiffnlp/twitter-roberta-base-sentiment-latest",

    # Model 2: Zero-shot topic classifier (BART-MNLI)
    "topic_model": "facebook/bart-large-mnli",

    # Candidate topic labels fed to zero-shot classifier
    "topic_labels": [
        "pricing and cost",
        "customer service",
        "product quality",
        "delivery and shipping",
        "technical support",
        "design and appearance",
        "performance and speed",
        "safety and recalls",
    ],

    # Maps zero-shot label back to short slug stored in JSON
    "topic_label_map": {
        "pricing and cost":        "pricing",
        "customer service":        "service",
        "product quality":         "quality",
        "delivery and shipping":   "delivery",
        "technical support":       "support",
        "design and appearance":   "design",
        "performance and speed":   "performance",
        "safety and recalls":      "safety",
    },

    # Only keep topic tags where zero-shot confidence exceeds this
    "topic_confidence_threshold": 0.20,

    # Max topics to assign per mention
    "max_topics": 2,

    # If sentiment confidence < this, label as "unclassified"
    "unclassified_threshold": 0.55,

    # Priority gates
    "priority_gates": {
        "crisis_keywords": [
            "fire", "overheating", "boycott", "lawsuit", "recall",
            "injury", "dangerous", "crisis", "resign",
        ],
        "high_engagement_threshold":   500,
        "medium_engagement_threshold": 100,
    },

    # Truncation length for sentiment model
    "max_length": 128,
}


# ---------------------------------------------------------------------------
# Load models
# ---------------------------------------------------------------------------

def load_sentiment_model(model_name: str):
    print(f"[1/2] Loading sentiment model: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)
    model.eval()
    return tokenizer, model


def load_topic_model(model_name: str):
    print(f"[2/2] Loading topic model:     {model_name}")
    # Use HuggingFace pipeline for zero-shot — handles batching internally
    return pipeline(
        "zero-shot-classification",
        model=model_name,
        device=0 if torch.cuda.is_available() else -1,
    )


# ---------------------------------------------------------------------------
# Sentiment inference
# ---------------------------------------------------------------------------

def predict_sentiment(text: str, tokenizer, model, config: dict) -> tuple[str, float]:
    # Standard preprocessing for Twitter-trained models
    text = re.sub(r"@\w+", "@user", text)
    text = re.sub(r"http\S+", "http", text)

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=config["max_length"],
        padding=True,
    )

    with torch.no_grad():
        logits = model(**inputs).logits

    scores = softmax(logits[0].numpy())

    # Label order from cardiffnlp model: 0=Negative, 1=Neutral, 2=Positive
    label_map = {0: "negative", 1: "neutral", 2: "positive"}
    predicted_class = int(scores.argmax())
    confidence = float(scores[predicted_class])

    if confidence < config["unclassified_threshold"]:
        return "unclassified", round(confidence, 3)

    return label_map[predicted_class], round(confidence, 3)


# ---------------------------------------------------------------------------
# Topic inference (zero-shot)
# ---------------------------------------------------------------------------

def predict_topics(text: str, topic_pipeline, config: dict) -> list[str]:
    result = topic_pipeline(
        text,
        candidate_labels=config["topic_labels"],
        multi_label=True,   # a mention can match multiple topics
    )

    topics = []
    for label, score in zip(result["labels"], result["scores"]):
        if score >= config["topic_confidence_threshold"]:
            slug = config["topic_label_map"].get(label, label)
            topics.append(slug)
        if len(topics) >= config["max_topics"]:
            break

    return topics if topics else ["service"]


# ---------------------------------------------------------------------------
# Priority assignment
# ---------------------------------------------------------------------------

def assign_priority(sentiment: str, engagement: int, text: str, is_crisis: bool, gates: dict) -> str:
    text_lower = text.lower()
    crisis_hit = is_crisis or any(
        re.search(r"\b" + re.escape(kw) + r"\b", text_lower)
        for kw in gates["crisis_keywords"]
    )
    if crisis_hit:
        return "critical"
    if sentiment == "negative" and engagement > gates["high_engagement_threshold"]:
        return "high"
    if sentiment == "negative" and engagement > gates["medium_engagement_threshold"]:
        return "medium"
    if sentiment == "negative":
        return "low"
    return "low"


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Classify brand mentions using two HuggingFace models (sentiment + zero-shot topics)"
    )
    parser.add_argument("--input",  default="../data/mentions_raw.csv",        help="Input CSV path")
    parser.add_argument("--output", default="../data/mentions_classified.json", help="Output JSON path")
    parser.add_argument("--batch",  type=int, default=0, help="Only process first N rows (0 = all)")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise FileNotFoundError(
            f"Input not found: {input_path}\nRun generate_data.py first."
        )

    with open(input_path, encoding="utf-8") as f:
        mentions = list(csv.DictReader(f))

    if args.batch > 0:
        mentions = mentions[: args.batch]

    print("=" * 60)
    print("  SentinelAI — HuggingFace Classification Pipeline")
    print("=" * 60)

    sent_tokenizer, sent_model = load_sentiment_model(CONFIG["sentiment_model"])
    topic_pipeline = load_topic_model(CONFIG["topic_model"])

    print(f"\nProcessing {len(mentions)} mentions...\n")

    classified = []
    for i, mention in enumerate(mentions):
        text       = mention["text"]
        engagement = int(mention.get("engagement", 0))
        is_crisis  = mention.get("is_crisis", "False") in (True, "True", "true", "1")

        sentiment, confidence = predict_sentiment(text, sent_tokenizer, sent_model, CONFIG)
        topics   = predict_topics(text, topic_pipeline, CONFIG)
        priority = assign_priority(sentiment, engagement, text, is_crisis, CONFIG["priority_gates"])

        classified.append({
            **mention,
            "engagement": engagement,
            "is_crisis":  is_crisis,
            "sentiment":  sentiment,
            "confidence": confidence,
            "topics":     topics,
            "priority":   priority,
            "status":     "unreviewed",
        })

        safe_text = text[:55].encode("ascii", errors="replace").decode("ascii")
        print(f"  [{i+1:>3}/{len(mentions)}] {sentiment:<12} conf={confidence:.2f}  topics={topics}  |  {safe_text}...")

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(classified, f, indent=2, ensure_ascii=False)

    sentiments = [m["sentiment"] for m in classified]
    print(f"\n{'=' * 60}")
    print(f"  Classification complete - {len(classified)} mentions")
    print(f"  positive:     {sentiments.count('positive')}")
    print(f"  negative:     {sentiments.count('negative')}")
    print(f"  neutral:      {sentiments.count('neutral')}")
    print(f"  unclassified: {sentiments.count('unclassified')}")
    print(f"  Output -> {output_path}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
