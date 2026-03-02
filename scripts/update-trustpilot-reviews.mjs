#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const TRUSTPILOT_URL = process.env.TRUSTPILOT_URL || "https://fr.trustpilot.com/review/marietroccaz.com";
const OUTPUT_PATH = path.resolve(process.cwd(), "assets/data/trustpilot-reviews.json");

const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const parseJsonSafe = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const collectNodes = (node, predicate, out = []) => {
  if (!node) return out;
  if (predicate(node)) out.push(node);

  if (Array.isArray(node)) {
    node.forEach((item) => collectNodes(item, predicate, out));
    return out;
  }

  if (typeof node === "object") {
    Object.values(node).forEach((value) => collectNodes(value, predicate, out));
  }

  return out;
};

const toReview = (reviewNode) => {
  const author =
    normalizeText(
      reviewNode?.author?.name ||
        reviewNode?.author ||
        reviewNode?.consumer?.displayName ||
        reviewNode?.name
    ) || "Client vérifié";

  const text = normalizeText(
    reviewNode?.reviewBody || reviewNode?.text || reviewNode?.description || reviewNode?.content
  );
  if (!text) return null;

  const ratingRaw =
    reviewNode?.reviewRating?.ratingValue ||
    reviewNode?.ratingValue ||
    reviewNode?.rating ||
    reviewNode?.score;
  const rating = Number.isFinite(Number(ratingRaw)) ? Number(ratingRaw) : null;

  const publishedAt = normalizeText(
    reviewNode?.datePublished || reviewNode?.publishedDate || reviewNode?.createdAt
  );

  return {
    author,
    text,
    rating,
    publishedAt: publishedAt || null
  };
};

const dedupeReviews = (reviews) => {
  const seen = new Set();
  return reviews.filter((review) => {
    const key = `${review.author}|${review.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const extractFromJsonLd = (html) => {
  const matches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const reviewNodes = [];

  for (const match of matches) {
    const payload = parseJsonSafe(match[1].trim());
    if (!payload) continue;
    collectNodes(payload, (node) => typeof node === "object" && normalizeText(node?.["@type"]).toLowerCase() === "review", reviewNodes);
  }

  return reviewNodes.map(toReview).filter(Boolean);
};

const extractFromNextData = (html) => {
  const match = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return [];

  const payload = parseJsonSafe(match[1].trim());
  if (!payload) return [];

  const reviewNodes = collectNodes(
    payload,
    (node) =>
      typeof node === "object" &&
      (!!node?.reviewBody || !!node?.text) &&
      (!!node?.author || !!node?.consumer || !!node?.reviewRating || !!node?.rating)
  );

  return reviewNodes.map(toReview).filter(Boolean);
};

const sortReviews = (reviews) => {
  return [...reviews].sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });
};

const run = async () => {
  const response = await fetch(TRUSTPILOT_URL, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; MarieTroccazBot/1.0; +https://marie-troccaz.fr)"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${TRUSTPILOT_URL}`);
  }

  const html = await response.text();
  const parsed = [...extractFromJsonLd(html), ...extractFromNextData(html)];
  const reviews = sortReviews(dedupeReviews(parsed)).slice(0, 12);

  if (reviews.length === 0) {
    throw new Error("No review could be extracted from Trustpilot page.");
  }

  const output = {
    source: TRUSTPILOT_URL,
    updatedAt: new Date().toISOString(),
    count: reviews.length,
    reviews
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Updated ${OUTPUT_PATH} with ${reviews.length} reviews.`);
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
