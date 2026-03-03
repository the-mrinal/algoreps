// Problem schema matching data/problems.json unified format
export interface ProblemExample {
  example_num: number;
  example_text: string;
  images: string[];
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  is_neetcode150: boolean;
  is_blind75: boolean;
  sheets: string[];
  topics: string[];
  description: string;
  examples: ProblemExample[];
  constraints: string[];
  hints: string[];
  code_snippets: Record<string, string>;
  neetcode_video_id: string | null;
  neetcode_url: string;
  leetcode_url: string;
}

// User progress matching user_progress Supabase table
export interface UserProgress {
  id: string;
  user_id: string;
  problem_id: string;
  is_self_reported: boolean;
  source_url: string | null;
  topics: string[];
  approach: string | null;
  remarks: string | null;
  code: string | null;
  time_taken_mins: number | null;
  performance_score: number;
  time_complexity: string | null;
  space_complexity: string | null;
  ai_review: AIReviewResponse | null;
  next_revision_date: string | null;
  created_at: string;
  updated_at: string;
}

// AI review response from Gemini
export interface AIReviewResponse {
  time_complexity: string;
  space_complexity: string;
  performance_score: number;
  review: {
    code_quality: string;
    edge_cases: string;
    alternative_approaches: string;
    interview_readiness: string;
  };
}

// SRS calculation result
export interface SRSResult {
  next_revision_date: Date;
  days_to_add: number;
}
