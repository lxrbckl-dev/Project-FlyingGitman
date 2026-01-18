# Project FlyingGitman
> Automatically follow and unfollow GitHub users to build your network. Spring 2026.
>
> **`TypeScript`** **`Docker`** `node-cron` `octokit`

---

### Local Development
```bash
npm install
npm run build
npm start
```

### Remote Deployment
```bash
docker run \
  -d \
  --name flyinggitman \
  --restart unless-stopped \
  -e FOLLOW_QUEUE_SIZE=25 \
  -e UNFOLLOW_QUEUE_SIZE=75 \
  -e GITHUB_USERNAME=lxrbckl \
  -e CRON_SCHEDULE="0 */6 * * *" \
  -e GITHUB_TOKEN=<your-token-here> \
  lxrbckl/project-flyinggitman:main
```

---