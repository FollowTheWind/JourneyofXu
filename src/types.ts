export type VoiceKey =
  | "male_classic"
  | "female_classic"
  | "male_calm"
  | "female_warm";

export type ReadingMode = "parallel" | "original" | "translation";

export interface CatalogArticle {
  id: string;
  title: string;
  dynasty: string;
  author: string;
  status: "sample" | "draft" | "complete";
  order: number;
}

export interface CatalogVolume {
  id: string;
  title: string;
  description: string;
  articles: CatalogArticle[];
}

export interface Catalog {
  title: string;
  description: string;
  volumes: CatalogVolume[];
}

export interface TextPair {
  pairId: string;
  original: string;
  translation: string;
  keywords: string[];
}

export interface Paragraph {
  id: string;
  scene: string;
  shareImage: string;
  ambientAudio: string;
  voiceAudio: Record<VoiceKey, string>;
  pairs: TextPair[];
}

export interface ArticlePart {
  id: string;
  heading: string;
  paragraphs: Paragraph[];
}

export interface Article {
  id: string;
  title: string;
  sourceNote: string;
  assetBase: string;
  intro: string;
  parts: ArticlePart[];
}

export interface SelectedPassage {
  text: string;
  counterpart: string;
  pairId: string;
  articleTitle: string;
  partHeading: string;
  scene: string;
  shareImage: string;
  source: "original" | "translation";
}
