# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application from a lightweight web server
FROM nginx:1.25-alpine

# Copy the built static files from the 'builder' stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy our custom Nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy our startup script
COPY start.sh /start.sh

# Make the startup script executable
RUN chmod +x /start.sh

# The new command to run our script when the container starts
CMD ["/start.sh"]