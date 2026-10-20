
FROM node:22-bookworm-slim

WORKDIR /app

# Enable pnpm through Corepack
RUN corepack enable

# Copy the monorepo
COPY . .

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Build the API
RUN pnpm --filter ./apps/api build

# API port
EXPOSE 4000

# Start the API
CMD ["pnpm", "--filter", "./apps/api", "start"]
