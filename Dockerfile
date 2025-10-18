# syntax=docker/dockerfile:1

# Use a small base image
FROM alpine:latest

# Add a simple label so we can confirm the build worked
LABEL maintainer="lxrbckl" \
      description="Test Docker build for GitHub Actions CI"

# Default command just prints a message
CMD ["echo", "✅ Docker build from GitHub Actions was successful!"]
