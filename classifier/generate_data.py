"""
generate_data.py

Builds mentions_raw.csv by sampling brand-specific tweets from brands.csv.
brands.csv contains:
  - Nike  : 300 real tweets from Sentiment140 corpus (twitter, 2009)
  - Apple : 300 real tweets from Sentiment140 corpus (twitter, 2009)
  - Tesla : 45  realistic modern tweets (Sentiment140 predates Tesla mainstream)

Each tweet gets assigned synthetic metadata:
  source, author, timestamp (30 days with a spike window), engagement, url

In a real deployment this file is replaced by live API scrapers.
The classifier (classify.py) receives the same CSV format regardless.

Usage:
    python generate_data.py
    python generate_data.py --dataset ../data/dataset/brands.csv --output ../data/mentions_raw.csv --count 150
"""

import csv
import random
import argparse
from datetime import datetime, timedelta
from pathlib import Path

SOURCES = ["Twitter", "Twitter", "Twitter", "Reddit", "Reddit", "Forum", "News", "Blog", "Review"]
REGIONS = ["US", "UK", "CA", "AU", "DE", "FR", "SG", "JP"]


def load_brand_tweets(dataset_path: Path) -> dict[str, list[str]]:
    """Load tweets grouped by brand from brands.csv."""
    buckets: dict[str, list[str]] = {}
    with open(dataset_path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            brand = row["brand"].strip()
            text = row["text"].strip()
            if text and len(text) > 10:
                buckets.setdefault(brand, []).append(text)
    return buckets


def random_timestamp(days_ago: int, base_date: datetime) -> str:
    dt = base_date - timedelta(
        days=days_ago,
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
        seconds=random.randint(0, 59),
    )
    return dt.strftime("%Y-%m-%dT%H:%M:%S")


def random_author(source: str) -> str:
    twitter_handles = [
        "user", "realuser", "just_me", "daily_thoughts", "tech_fan",
        "brand_watcher", "honest_review", "consumer_report", "gadget_lover",
        "sneaker_head", "ev_driver", "apple_fan", "product_reviewer",
    ]
    reddit_names = [
        "throwaway_consumer", "long_time_lurker", "actual_owner",
        "skeptical_buyer", "verified_purchase", "daily_driver_review",
        "first_post_here", "lurker_no_more",
    ]
    news_outlets = [
        "Reuters Staff", "Bloomberg Technology", "TechCrunch",
        "CNBC Markets", "BBC Technology", "The Verge", "Engadget",
    ]
    blog_authors = [
        "James W.", "Sarah C.", "Mark O.", "Priya S.",
        "Tom R.", "Elena V.", "David P.", "Amara O.",
    ]
    review_authors = [
        "VerifiedBuyer", "TrustpilotUser", "AmazonCustomer",
        "LongTermOwner", "ProductTester", "G2Reviewer",
    ]
    forum_names = [
        "forum_member", "community_user", "registered_poster",
        "active_member", "thread_starter", "long_time_member",
    ]
    if source == "Twitter":
        return "@" + random.choice(twitter_handles) + str(random.randint(10, 9999))
    elif source == "Reddit":
        return "u/" + random.choice(reddit_names)
    elif source == "Forum":
        return random.choice(forum_names) + str(random.randint(10, 999))
    elif source == "News":
        return random.choice(news_outlets)
    elif source == "Blog":
        return random.choice(blog_authors)
    else:
        return random.choice(review_authors)


def random_engagement(source: str, is_crisis: bool) -> int:
    if is_crisis:
        return random.randint(1200, 8000)
    ranges = {
        "Twitter": (0, 2400),
        "Reddit":  (0, 1800),
        "Forum":   (0, 800),
        "News":    (0, 5000),
        "Blog":    (0, 400),
        "Review":  (0, 120),
    }
    lo, hi = ranges.get(source, (0, 500))
    return random.randint(lo, hi)


def random_url(source: str, brand: str, idx: int) -> str:
    brand_slug = brand.lower()
    urls = {
        "Twitter": f"https://twitter.com/user/status/{1800000000000 + idx * 137}",
        "Reddit":  f"https://reddit.com/r/{brand_slug}/comments/{idx:07x}",
        "Forum":   f"https://forum.example.com/t/{brand_slug}-discussion-{idx}",
        "News":    f"https://techcrunch.com/2025/{random.randint(1,4)}/{random.randint(1,28)}/{brand_slug}-{idx}",
        "Blog":    f"https://blog.example.com/reviews/{brand_slug}-review-{idx}",
        "Review":  f"https://www.trustpilot.com/reviews/{brand_slug}-{idx}",
    }
    return urls.get(source, f"https://example.com/post/{idx}")


def generate_mentions(brand_tweets: dict[str, list[str]], count: int, base_date: datetime) -> list[dict]:
    brands = list(brand_tweets.keys())
    mentions = []
    id_counter = 1

    for brand in brands:
        pool = brand_tweets[brand]

        for day in range(30, 0, -1):
            # Days 8-10: simulated reputation crisis — higher negative volume
            is_spike = 8 <= day <= 10
            batch_size = random.randint(4, 8) if is_spike else random.randint(2, 4)

            for i in range(batch_size):
                source = random.choice(SOURCES)
                is_crisis = is_spike and i == 0 and brand == "Tesla"

                # Sample a real brand-specific tweet
                text = random.choice(pool)

                mentions.append({
                    "id":         f"mention-{str(id_counter).zfill(4)}",
                    "brand":      brand,
                    "source":     source,
                    "author":     random_author(source),
                    "text":       text,
                    "timestamp":  random_timestamp(day, base_date),
                    "region":     random.choice(REGIONS),
                    "language":   "en",
                    "engagement": random_engagement(source, is_crisis),
                    "url":        random_url(source, brand, id_counter),
                    "is_crisis":  is_crisis,
                })
                id_counter += 1

    mentions.sort(key=lambda m: m["timestamp"], reverse=True)
    return mentions[:count]


def main():
    parser = argparse.ArgumentParser(
        description="Build mentions_raw.csv from brand-specific tweet dataset"
    )
    parser.add_argument("--dataset", default="../data/dataset/brands.csv", help="Path to brands.csv")
    parser.add_argument("--output",  default="../data/mentions_raw.csv",   help="Output CSV path")
    parser.add_argument("--count",   type=int, default=300,                help="Number of mentions (50+ per brand)")
    args = parser.parse_args()

    dataset_path = Path(args.dataset)
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}\nRun build_brands_dataset.py first.")

    print(f"Loading brand tweets from {dataset_path}...")
    brand_tweets = load_brand_tweets(dataset_path)
    for brand, tweets in brand_tweets.items():
        print(f"  {brand}: {len(tweets):,} tweets available")

    base_date = datetime(2025, 4, 7)
    mentions = generate_mentions(brand_tweets, args.count, base_date)

    fieldnames = [
        "id", "brand", "source", "author", "text",
        "timestamp", "region", "language", "engagement", "url", "is_crisis",
    ]

    with open(args.output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(mentions)

    from collections import Counter
    brand_counts = Counter(m["brand"] for m in mentions)
    source_counts = Counter(m["source"] for m in mentions)

    print(f"\nGenerated {len(mentions)} mentions -> {args.output}")
    print(f"  By brand:  " + "  ".join(f"{b}: {c}" for b, c in sorted(brand_counts.items())))
    print(f"  By source: " + "  ".join(f"{s}: {c}" for s, c in sorted(source_counts.items())))


if __name__ == "__main__":
    main()
