/**
 * TypeScript interfaces for GitHub API data structures
 */

export interface User {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization';
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    code: string;
    field: string;
  }>;
}