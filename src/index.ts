import { schedule } from 'node-cron';
import { GitHubClient } from './octokit.js';
import { DiscoveryOptions } from './interfaces.js';


const username = 'lxrbckl';
const followQueueSize = 25;
const unfollowQueueSize = 75;

const client = new GitHubClient('');


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
    const followingUsernames = following.map(f => f.login);

    const usersToUnfollow: string[] = [];
    const checkedUsers = new Set<string>();

    while (usersToUnfollow.length < unfollowQueueSize) {
      const availableUsers = followingUsernames.filter(username => !checkedUsers.has(username));

      if (availableUsers.length === 0) {
        break;
      }

      const randomIndex = Math.floor(Math.random() * availableUsers.length);
      const randomUser = availableUsers[randomIndex]!;
      checkedUsers.add(randomUser);

      if (!myFollowerUsernames.has(randomUser)) {
        usersToUnfollow.push(randomUser);
      }
    }

    return usersToUnfollow;
  } catch (error) {
    throw error;
  }
}

async function main() {
  try {
    // Step 1: Discover users to unfollow
    const usersToUnfollow = await discoverUsersToUnfollow(username, unfollowQueueSize);

    // Step 2: Unfollow the discovered users
    for (const userToUnfollow of usersToUnfollow) {
      try {
        await client.toUnfollow(userToUnfollow);
      } catch (error) {
        // Continue with next user even if one fails
      }
    }

    // Step 3: Discover users to follow
    const usersToFollow = await discoverUsersToFollow({
      authenticatedUsername: username,
      followQueueSize: followQueueSize,
      visitedUsers: new Set(),
      toFollowList: []
    });

    // Step 4: Follow the discovered users
    for (const userToFollow of usersToFollow) {
      try {
        await client.toFollow(userToFollow);
      } catch (error) {
        // Continue with next user even if one fails
      }
    }

  } catch (error) {
    throw error;
  }
}

main();