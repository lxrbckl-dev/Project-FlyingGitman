import { schedule } from 'node-cron';
import { GitHubClient } from './octokit.js';
import { DiscoveryOptions } from './interfaces.js';


const client = new GitHubClient(process.env.GITHUB_TOKEN!);

const username = process.env.GITHUB_USERNAME!;
const cronSchedule = process.env.CRON_SCHEDULE;
const followQueueSize = parseInt(process.env.FOLLOW_QUEUE_SIZE!);
const unfollowQueueSize = parseInt(process.env.UNFOLLOW_QUEUE_SIZE!);


/**
 * Recursively discovers users to follow by exploring follower networks
 * @param options Discovery options including username, queue size, visited users, and current list
 * @returns Promise<string[]> List of usernames to follow
 */
async function discoverUsersToFollow(options: DiscoveryOptions): Promise<string[]> {
  const { authenticatedUsername, followQueueSize, visitedUsers, toFollowList } = options;

  console.log(`🔄 Discovery progress: ${toFollowList.length}/${followQueueSize} users found`);

  if (toFollowList.length >= followQueueSize) {
    console.log('✅ Reached follow queue limit, returning results');
    return toFollowList.slice(0, followQueueSize);
  }

  try {
    const myFollowers = await client.getFollowers(authenticatedUsername, { getAll: true });
    const myFollowerUsernames = new Set(myFollowers.map(f => f.login));

    const following = await client.getFollowing(authenticatedUsername, { getAll: true });
    const followingUsernames = following.map(f => f.login);

    const availableUsers = followingUsernames.filter(username => !visitedUsers.has(username));


    if (availableUsers.length === 0) {
      console.log('🚫 No more users to explore, returning current results');
      return toFollowList.slice(0, followQueueSize);
    }

    const randomIndex = Math.floor(Math.random() * availableUsers.length);
    const randomUser = availableUsers[randomIndex]!;
    visitedUsers.add(randomUser);
    console.log(`🎯 Exploring followers of: ${randomUser}`);

    const randomUserFollowers = await client.getFollowers(randomUser, { getAll: true });
    const potentialFollows = randomUserFollowers
      .map(f => f.login)
      .filter(username =>
        !myFollowerUsernames.has(username) &&
        !followingUsernames.includes(username) &&
        !toFollowList.includes(username) &&
        username !== authenticatedUsername
      );

    console.log(`✨ Found ${potentialFollows.length} potential follows from ${randomUser}'s followers`);
    toFollowList.push(...potentialFollows);

    return discoverUsersToFollow({
      authenticatedUsername,
      followQueueSize,
      visitedUsers,
      toFollowList
    });
  } catch (error) {
    console.error('❌ Error during follow discovery:', error);
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
  console.log('🔍 Analyzing follow relationships...');
  try {
    const myFollowers = await client.getFollowers(authenticatedUsername, { getAll: true });
    const myFollowerUsernames = new Set(myFollowers.map(f => f.login));
    console.log(`👥 You have ${myFollowers.length} followers`);

    const following = await client.getFollowing(authenticatedUsername, { getAll: true });
    const followingUsernames = following.map(f => f.login);
    console.log(`👤 You are following ${followingUsernames.length} users`);

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

    console.log(`🎯 Identified ${usersToUnfollow.length} users who don't follow you back`);
    return usersToUnfollow;
  } catch (error) {
    console.error('❌ Error during unfollow discovery:', error);
    throw error;
  }
}

async function main() {
  console.log(`🚀 Starting FlyingGitman for user: ${username}`);
  console.log(`📊 Configuration: followQueueSize=${followQueueSize}, unfollowQueueSize=${unfollowQueueSize}`);

  schedule(cronSchedule!, async () => {
    try {
      // Step 1: Discover users to unfollow
      console.log('🔍 Discovering users to unfollow...');
      const usersToUnfollow = await discoverUsersToUnfollow(username, unfollowQueueSize);
      console.log(`📋 Found ${usersToUnfollow.length} users to unfollow:`, usersToUnfollow);

      // Step 2: Unfollow the discovered users
      console.log('👋 Unfollowing users...');
      let unfollowSuccessCount = 0;
      for (const userToUnfollow of usersToUnfollow) {
        try {
          const result = await client.toUnfollow(userToUnfollow);
          if (result) {
            console.log(`✅ Unfollowed: ${userToUnfollow}`);
            unfollowSuccessCount++;
          } else {
            console.log(`ℹ️  Already not following or failed: ${userToUnfollow}`);
          }
        } catch (error) {
          console.log(`❌ Failed to unfollow ${userToUnfollow}:`, error instanceof Error ? error.message : error);
        }
      }
      console.log(`📈 Unfollow results: ${unfollowSuccessCount}/${usersToUnfollow.length} successful`);

      // Step 3: Discover users to follow
      console.log('🔍 Discovering users to follow...');
      const usersToFollow = await discoverUsersToFollow({
        authenticatedUsername: username,
        followQueueSize: followQueueSize,
        visitedUsers: new Set(),
        toFollowList: []
      });
      console.log(`📋 Found ${usersToFollow.length} users to follow:`, usersToFollow);

      // Step 4: Follow the discovered users
      console.log('➕ Following users...');
      let followSuccessCount = 0;
      for (const userToFollow of usersToFollow) {
        try {
          const result = await client.toFollow(userToFollow);
          if (result) {
            console.log(`✅ Followed: ${userToFollow}`);
            followSuccessCount++;
          } else {
            console.log(`ℹ️  Already following or failed: ${userToFollow}`);
          }
        } catch (error) {
          console.log(`❌ Failed to follow ${userToFollow}:`, error instanceof Error ? error.message : error);
        }
      }
      console.log(`📈 Follow results: ${followSuccessCount}/${usersToFollow.length} successful`);
      console.log('🎉 FlyingGitman execution completed!');

    } catch (error) {
      console.error('💥 Fatal error during execution:', error);
      throw error;
    }
  });

}

main();