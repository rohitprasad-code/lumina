# Use Node.js 20 slim as the base image
FROM node:20-slim

# Install Python and other necessary tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt-get/lists/*

# Set the working directory
WORKDIR /app

# Copy package management files
COPY package.json package-lock.json* requirements.txt ./

# Install Node.js dependencies
RUN npm install

# Install Python dependencies
# We install them globally in the container for simplicity, 
# but could also use a virtual environment.
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3000

# Expose the application port
EXPOSE 3000

# Default command to run the development server
# To run in production, you would override this with `npm run build && npm run start`
CMD ["npm", "run", "dev"]
