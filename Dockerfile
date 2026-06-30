# Build stage
FROM node:24-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Clean default nginx html directory
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled output from build stage
# Note: Angular 17+ outputs to dist/<project-name>/browser
COPY --from=build /app/dist/user-management/browser /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
