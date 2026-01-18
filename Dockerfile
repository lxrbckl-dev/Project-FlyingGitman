FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY src/ ./src/
COPY tsconfig.json ./

RUN npm install -g typescript

RUN npm run build

ENV GITHUB_TOKEN=${GITHUB_TOKEN}
ENV CRON_SCHEDULE=${CRON_SCHEDULE}
ENV GITHUB_USERNAME=${GITHUB_USERNAME}
ENV FOLLOW_QUEUE_SIZE=${FOLLOW_QUEUE_SIZE}
ENV UNFOLLOW_QUEUE_SIZE=${UNFOLLOW_QUEUE_SIZE}

CMD ["npm", "start"]