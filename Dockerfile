# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install standard dependencies
RUN npm ci

# Copy full source tree
COPY . .

# Compile both Vite assets and build standalone server.cjs using esbuild
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy dependency configs
COPY package*.json ./

# Install only production-only dependencies
RUN npm ci --only=production

# Copy built application distribution from builder
COPY --from=builder /app/dist ./dist

# Expose port (Matches Express port inside server.ts)
EXPOSE 3000

# Spin up the compiled Node.js backend
CMD ["npm", "run", "start"]
