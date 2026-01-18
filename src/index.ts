import { schedule } from 'node-cron';
import { GitHubClient } from './octokit.js';


const client = new GitHubClient('');

const username = 'lxrbckl';
const followBatchSize = 25;
const targetBranch = 'main';
const unfollowBatchSize = 25;
const followQueueSize = 250;
const unfollowQueueSize = 250;
const targetFollowFile = 'data/toFollow.json';
const targetRepository = 'Project-FlyingGitman';
const targetUnfollowFile = 'data/toUnfollow.json';
const commitMessage = 'Project FlyingGitman - Automated Data Collection';


async function main() {
  try {



  } catch (error) {
    throw error;
  }
}

main();