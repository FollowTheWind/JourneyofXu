import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const contentDir = path.join(publicDir, "content");
const catalogPath = path.join(contentDir, "catalog.json");

const requiredVoices = [
  "male_classic",
  "female_classic",
  "male_calm",
  "female_warm",
];

const errors = [];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`Cannot read JSON: ${path.relative(root, filePath)} (${error.message})`);
    return null;
  }
}

function existsPublicAsset(assetPath, context) {
  if (!assetPath || typeof assetPath !== "string") {
    errors.push(`${context} is missing an asset path`);
    return;
  }

  const normalized = assetPath.replace(/^\/+/, "");
  const absolutePath = path.join(publicDir, normalized);
  if (!absolutePath.startsWith(publicDir) || !fs.existsSync(absolutePath)) {
    errors.push(`${context} references missing asset: ${assetPath}`);
  }
}

function validateArticle(article, articlePath) {
  if (!article?.id || !article?.title || !article?.intro || !Array.isArray(article?.parts)) {
    errors.push(`${path.relative(root, articlePath)} is missing id, title, intro, or parts`);
    return;
  }

  const pairIds = new Set();
  const paragraphIds = new Set();

  article.parts.forEach((part, partIndex) => {
    if (!part.id || !part.heading || !Array.isArray(part.paragraphs)) {
      errors.push(`${article.id} part ${partIndex + 1} is missing id, heading, or paragraphs`);
      return;
    }

    part.paragraphs.forEach((paragraph, paragraphIndex) => {
      const label = `${article.id}/${part.id}/paragraph ${paragraphIndex + 1}`;

      if (!paragraph.id || paragraphIds.has(paragraph.id)) {
        errors.push(`${label} has a missing or duplicate paragraph id`);
      }
      paragraphIds.add(paragraph.id);

      existsPublicAsset(paragraph.shareImage, `${label} shareImage`);
      existsPublicAsset(paragraph.ambientAudio, `${label} ambientAudio`);

      requiredVoices.forEach((voice) => {
        existsPublicAsset(paragraph.voiceAudio?.[voice], `${label} voiceAudio.${voice}`);
      });

      if (!Array.isArray(paragraph.pairs) || paragraph.pairs.length === 0) {
        errors.push(`${label} must contain at least one original/translation pair`);
        return;
      }

      paragraph.pairs.forEach((pair, pairIndex) => {
        const pairLabel = `${label}/pair ${pairIndex + 1}`;
        if (!pair.pairId || pairIds.has(pair.pairId)) {
          errors.push(`${pairLabel} has a missing or duplicate pairId`);
        }
        pairIds.add(pair.pairId);

        if (!pair.original || !pair.translation) {
          errors.push(`${pairLabel} must contain original and translation`);
        }
      });
    });
  });
}

const catalog = readJson(catalogPath);

if (catalog) {
  if (!catalog.title || !Array.isArray(catalog.volumes) || catalog.volumes.length === 0) {
    errors.push("catalog.json must contain title and non-empty volumes");
  }

  const articleIds = new Set();
  catalog.volumes?.forEach((volume, volumeIndex) => {
    if (!volume.id || !volume.title || !Array.isArray(volume.articles)) {
      errors.push(`catalog volume ${volumeIndex + 1} is missing id, title, or articles`);
      return;
    }

    volume.articles.forEach((entry, articleIndex) => {
      if (!entry.id || !entry.title) {
        errors.push(`catalog article ${volume.id}/${articleIndex + 1} is missing id or title`);
        return;
      }
      if (articleIds.has(entry.id)) {
        errors.push(`catalog article id is duplicated: ${entry.id}`);
      }
      articleIds.add(entry.id);

      const articlePath = path.join(contentDir, "articles", `${entry.id}.json`);
      if (!fs.existsSync(articlePath)) {
        errors.push(`catalog references missing article: ${entry.id}`);
        return;
      }

      const article = readJson(articlePath);
      validateArticle(article, articlePath);
    });
  });
}

if (errors.length > 0) {
  console.error("Content validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Content validation passed.");
