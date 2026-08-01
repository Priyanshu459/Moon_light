FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate prisma client
RUN npm install
RUN npx prisma generate

# Copy source code and build the application
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy only production dependencies and built files
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --only=production
RUN npx prisma generate
COPY --from=builder /app/dist ./dist

# Create a volume for media uploads
VOLUME /app/media

EXPOSE 3000

# Run migrations and then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
