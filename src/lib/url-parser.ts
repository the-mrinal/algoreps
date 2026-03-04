export type Platform =
  | "LeetCode"
  | "CodeChef"
  | "HackerRank"
  | "Codeforces"
  | "GeeksforGeeks";

export interface ParsedUrl {
  platform: Platform;
  slug: string;
}

const PLATFORM_PATTERNS: { platform: Platform; regex: RegExp }[] = [
  {
    platform: "LeetCode",
    regex: /leetcode\.com\/problems\/([a-z0-9-]+)/,
  },
  {
    platform: "CodeChef",
    regex: /codechef\.com\/problems\/([A-Za-z0-9_]+)/,
  },
  {
    platform: "HackerRank",
    regex: /hackerrank\.com\/challenges\/([a-z0-9-]+)/,
  },
  {
    platform: "Codeforces",
    regex: /codeforces\.com\/(?:contest|problemset\/problem)\/(\d+)\/([A-Za-z0-9]+)/,
  },
  {
    platform: "GeeksforGeeks",
    regex: /geeksforgeeks\.org\/problems\/([a-z0-9-]+)/,
  },
];

/**
 * Detect platform from a URL and extract a slug.
 * Returns null if the URL doesn't match any known platform.
 */
export function parseUrl(url: string): ParsedUrl | null {
  for (const { platform, regex } of PLATFORM_PATTERNS) {
    const match = url.match(regex);
    if (!match) continue;

    if (platform === "Codeforces") {
      return { platform, slug: `${match[1]}-${match[2]}` };
    }

    return { platform, slug: match[1] };
  }

  return null;
}

/**
 * Convert a slug like "two-sum" into a title like "Two Sum".
 */
export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
