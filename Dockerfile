# Use a base image with both Node.js and Python
FROM node:20-slim AS builder

# Install dependencies for building
RUN apt-get update && apt-get install -y python3 python3-pip

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy source files
COPY . .

# Build the React app
RUN npm run build

# --- Runtime ---
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy built files from the builder
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/python /app/python

# Install Python dependencies if any (though server.py says zero dependencies)
# COPY --from=builder /app/requirements.txt ./
# RUN pip install -r requirements.txt

# Expose port
EXPOSE 3000

# Start the server
CMD ["python", "python/server.py"]
