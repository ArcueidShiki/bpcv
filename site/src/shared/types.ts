export type Lang = 'en' | 'zh';

/** Every user-visible string exists in both languages; only one is ever shown. */
export interface Bi { en: string; zh: string }

/** One handbook entry, after simplification: the principle and one example or
 *  analogy. Nothing else is rendered as prose. */
export interface Entry {
  id: string;
  cat: string;
  name: Bi;
  score?: number;
  /** Short and language-specific: maths stays maths, labels are translated. */
  formula?: Bi;
  principle: Bi;
  example: Bi;
}

export interface Category { id: string; label: Bi }
