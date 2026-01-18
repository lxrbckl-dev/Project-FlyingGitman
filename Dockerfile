FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY data/ ./data

ENV GITHUB_TOKEN=${GITHUB_TOKEN}
ENV CRON_SCHEDULE=${CRON_SCHEDULE}
ENV GITHUB_USERNAME=${GITHUB_USERNAME}
ENV FOLLOW_QUEUE_SIZE=${FOLLOW_QUEUE_SIZE}
ENV UNFOLLOW_QUEUE_SIZE=${UNFOLLOW_QUEUE_SIZE}

CMD ["npm", "start"]