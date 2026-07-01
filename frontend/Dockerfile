# Packages the Pre-Legal frontend (Next.js) into a container.
# Build context is the repo root (see docker-compose.yml) so this can copy
# templates/ alongside frontend/, matching the path the app reads at runtime.
FROM node:20-alpine

WORKDIR /app
COPY templates/ ./templates/
COPY frontend/package.json frontend/package-lock.json ./frontend/

WORKDIR /app/frontend
RUN npm ci

COPY frontend/ .

# NEXT_PUBLIC_* vars are inlined at build time, so this must be a build arg,
# not a runtime environment variable.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
