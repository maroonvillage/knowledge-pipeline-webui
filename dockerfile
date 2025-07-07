# frontend/Dockerfile

# ---- Build Stage ----
# Use an official Node.js image as the builder
# Choose a version compatible with your project. 'alpine' versions are smaller.
FROM node:22-alpine as build-stage

# Set working directory
WORKDIR /app

# Copy package.json and lock file (leverages Docker cache)
COPY package.json ./
COPY package-lock.json ./
# Or if using yarn:
# COPY yarn.lock ./

# Install dependencies
# Use 'ci' for potentially faster/more reliable installs in CI/CD environments
RUN npm ci
# Or if using yarn:
# RUN yarn install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the React application for production
# Make sure REACT_APP_API_URL is set correctly here or handled by Nginx proxy
# Example: Setting build-time arg (less common for frontend API URLs)
# ARG REACT_APP_API_URL=/api
# ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm install && npm run build

# ---- Serve Stage ----
# Use a lightweight Nginx image to serve the static files
FROM nginx:stable-alpine

# Copy the static build files from the build stage to Nginx's webroot
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy the custom Nginx configuration file
# We'll create this file next (nginx.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (Nginx default)
EXPOSE 80

# Default command for Nginx image starts the server
# This is usually the default
CMD ["nginx", "-g", "daemon off;"] 
# Optional: if you want to serve with a basic static server for local dev
#CMD ["npx", "serve", "-s", "build", "-l", "3000"]