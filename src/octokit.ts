import { Octokit } from 'octokit';
import { User, PaginationOptions, FollowResult } from './interfaces.js';


export class GitHubClient {
  private octokit: Octokit;

  /**
   * Creates a GitHub client instance with authentication
   * @param authToken GitHub personal access token
   */
  constructor(authToken: string) {
    this.octokit = new Octokit({
      auth: authToken,
    });
  }

  /**
   * Fetches followers for the specified user
   * @param username Username to get followers for
   * @param options Pagination options. If getAll is true, fetches all followers automatically
   * @returns Promise<User[]> Array of follower users
   */
  async getFollowers(username: string, options: PaginationOptions = {}): Promise<User[]> {
    const { page = 1, per_page = 30, getAll = false } = options;
    const itemsPerPage = Math.min(per_page || (getAll ? 100 : 30), 100); 
    const allFollowers: User[] = [];
    let currentPage = page;

    try {
      while (true) {
        const response = await this.octokit.request('GET /users/{username}/followers', {
          username,
          page: currentPage,
          per_page: itemsPerPage,
        });

        const followers = response.data;

        if (followers.length === 0) {
          break;
        }

        allFollowers.push(...followers);

        if (!getAll) {
          break;
        }

        currentPage++;

        if (followers.length < itemsPerPage) {
          break;
        }
      }

      return allFollowers;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches users that the specified user follows
   * @param username Username to get following for
   * @param options Pagination options. If getAll is true, fetches all following automatically
   * @returns Promise<User[]> Array of users being followed
   */
  async getFollowing(username: string, options: PaginationOptions = {}): Promise<User[]> {
    const { page = 1, per_page = 30, getAll = false } = options;
    const itemsPerPage = Math.min(per_page || (getAll ? 100 : 30), 100); 
    const allFollowing: User[] = [];
    let currentPage = page;

    try {
      while (true) {
        const response = await this.octokit.request('GET /users/{username}/following', {
          username,
          page: currentPage,
          per_page: itemsPerPage,
        });

        const following = response.data;

        if (following.length === 0) {
          break;
        }

        allFollowing.push(...following);

        if (!getAll) {
          break;
        }

        currentPage++;

        if (following.length < itemsPerPage) {
          break;
        }
      }

      return allFollowing;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Follows the specified user
   * @param username Username to follow
   * @returns Promise<void>
   */
  async followUser(username: string): Promise<void> {
    try {
      await this.octokit.request('PUT /user/following/{username}', {
        username,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Unfollows the specified user
   * @param username Username to unfollow
   * @returns Promise<void>
   */
  async unfollowUser(username: string): Promise<void> {
    try {
      await this.octokit.request('DELETE /user/following/{username}', {
        username,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Follows the specified user
   * @param username Username to follow
   * @returns Promise<string | null> Username if followed successfully, null if already following
   */
  async toFollow(username: string): Promise<FollowResult> {
    try {
      await this.followUser(username);
      return username;
    } catch (error: any) {
      if (error.status === 422 || error.message?.includes('already following')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Unfollows the specified user
   * @param username Username to unfollow
   * @returns Promise<string | null> Username if unfollowed successfully, null if not following
   */
  async toUnfollow(username: string): Promise<FollowResult> {
    try {
      await this.unfollowUser(username);
      return username;
    } catch (error: any) {
      if (error.status === 404 || error.message?.includes('not following')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Writes JSON data to a file in a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param path File path within the repository
   * @param data Data to write as JSON
   * @param branch Branch name
   * @param commitMessage Commit message
   */
  async writeFileContents(
    owner: string,
    repo: string,
    path: string,
    data: any,
    branch: string,
    commitMessage: string
  ): Promise<void> {
    try {
      const content = JSON.stringify(data, null, 2);
      let sha: string | undefined;
      try {
        const existingFile = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path,
          ref: branch,
        });
        if (!Array.isArray(existingFile.data)) {
          sha = existingFile.data.sha;
        }
      } catch (error) {
      }

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: commitMessage,
        content: Buffer.from(content).toString('base64'),
        branch,
        sha,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reads JSON data from a file in a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param path File path within the repository
   * @param branch Branch name (optional, defaults to default branch)
   * @returns Promise<any> Parsed JSON data from the file
   */
  async readFileContents(
    owner: string,
    repo: string,
    path: string,
    branch?: string
  ): Promise<any> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      if (Array.isArray(response.data)) {
        throw new Error('Path points to a directory, not a file');
      }

      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw error;
    }
  }
}