export interface RagCitation {
  doc: string;
  chapter: string;
  page: string;
}

export interface RagAnswer {
  answer: string;
  citations: RagCitation[];
}
