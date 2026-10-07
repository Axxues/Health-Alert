export interface RagCitation {
  doc: string;
  chapter: string;
  page: string;
  source?: string;
}

export interface RagAnswer {
  answer: string;
  citations: RagCitation[];
}
