import { schedule } from 'node-cron';
import { GitHubClient } from './octokit.js';
import { DiscoveryOptions } from './interfaces.js';


const client = new GitHubClient('');

const username = 'lxrbckl';
const followQueueSize = 25;
const targetBranch = 'main';
const unfollowQueueSize = 25;
const targetFollowFile = 'data/toFollow.json';
const targetRepository = 'Project-FlyingGitman';
const targetUnfollowFile = 'data/toUnfollow.json';
const commitMessage = 'Project FlyingGitman - Automated Data Collection';

/**
 * Recursively discovers users to follow by exploring follower networks
 * @param options Discovery options including username, queue size, visited users, and current list
 * @returns Promise<string[]> List of usernames to follow
 */
async function discoverUsersToFollow(options: DiscoveryOptions): Promise<string[]> {
  const { authenticatedUsername, followQueueSize, visitedUsers, toFollowList } = options;

  if (toFollowList.length >= followQueueSize) {
    return toFollowList.slice(0, followQueueSize);
  }

  try {
    const myFollowers = await client.getFollowers(authenticatedUsername, { getAll: true });
    const myFollowerUsernames = new Set(myFollowers.map(f => f.login));

    const following = await client.getFollowing(authenticatedUsername, { getAll: true });
    const followingUsernames = following.map(f => f.login);

    const availableUsers = followingUsernames.filter(username => !visitedUsers.has(username));

    if (availableUsers.length === 0) {
      return toFollowList.slice(0, followQueueSize);
    }

    const randomIndex = Math.floor(Math.random() * availableUsers.length);
    const randomUser = availableUsers[randomIndex]!;
    visitedUsers.add(randomUser);

    const randomUserFollowers = await client.getFollowers(randomUser, { getAll: true });
    const potentialFollows = randomUserFollowers
      .map(f => f.login)
      .filter(username =>
        !myFollowerUsernames.has(username) &&
        !followingUsernames.includes(username) &&
        !toFollowList.includes(username) &&
        username !== authenticatedUsername
      );

    toFollowList.push(...potentialFollows);

    return discoverUsersToFollow({
      authenticatedUsername,
      followQueueSize,
      visitedUsers,
      toFollowList
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Discovers users to unfollow - those you follow but who don't follow you back
 * @param authenticatedUsername The authenticated user's username
 * @param unfollowQueueSize Maximum number of users to add to unfollow queue
 * @returns Promise<string[]> List of usernames to unfollow
 */
async function discoverUsersToUnfollow(
  authenticatedUsername: string,
  unfollowQueueSize: number
): Promise<string[]> {
  try {
    const myFollowers = await client.getFollowers(authenticatedUsername, { getAll: true });
    const myFollowerUsernames = new Set(myFollowers.map(f => f.login));

    const following = await client.getFollowing(authenticatedUsername, { getAll: true });

    const usersToUnfollow = following
      .map(f => f.login)
      .filter(username => !myFollowerUsernames.has(username));

    return usersToUnfollow.slice(0, unfollowQueueSize);
  } catch (error) {
    throw error;
  }
}

async function main() {
  try {



  } catch (error) {
    throw error;
  }
}

main();