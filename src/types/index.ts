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
  pattern_order: number | null;
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
  time_taken_seconds: number | null;
  run_count: number;
  successful_run_number: number | null;
  manually_solved: boolean;
  performance_score: number;
  time_complexity: string | null;
  space_complexity: string | null;
  ai_review: AIReviewResponse | null;
  next_revision_date: string | null;
  interval_step: number;
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

// User profile matching profiles Supabase table
export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  is_premium: boolean;
  questions_per_day: number;
  hours_per_day: number;
  proficiency_level: "beginner" | "rusty" | "intermediate" | "advanced";
  interview_date: string | null;
  problem_set: string;
  onboarding_completed: boolean;
  current_pattern_index: number;
}

// SRS calculation result
export interface SRSResult {
  next_revision_date: Date;
  days_to_add: number;
  interval_step: number;
}

// User pattern confidence from diagnostic assessment
export interface UserPatternConfidence {
  id: string;
  user_id: string;
  pattern_name: string;
  confidence_rating: number;
  diagnostic_problem_id: string | null;
  diagnostic_score: number | null;
  created_at: string;
}

// Daily plan item
export interface PlanItem {
  problem_id: string;
  type: "revision" | "new";
  status: "pending" | "completed" | "skipped";
  difficulty: string;
  category: string;
  estimated_minutes: number;
}

// Daily plan persisted to daily_plans table
export interface DailyPlan {
  id: string;
  user_id: string;
  plan_date: string;
  plan_data: PlanItem[];
  created_at: string;
  updated_at: string;
}
