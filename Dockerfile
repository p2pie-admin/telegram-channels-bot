FROM mcr.microsoft.com/playwright:v1.58.2-jammy AS base

WORKDIR /app

COPY package.json yarn.lock ./
# Keep dev deps because `playwright` is currently declared in devDependencies
# but is required at runtime for image generation.
RUN yarn install --frozen-lockfile --production=false

COPY . .
RUN yarn build

# Runtime env defaults (can be overridden by docker-compose / k8s / docker run -e)
ENV NODE_ENV=production \
    PORT=3030

# Trim caches to reduce push size before publishing to Docker Hub
RUN yarn cache clean || true \
 && rm -rf /root/.cache/ms-playwright/.links || true

EXPOSE 3030

CMD ["node", "dist/index.js"]
