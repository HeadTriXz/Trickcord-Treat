FROM node:20-alpine
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --include=dev

# Copy the rest of the files
COPY . .

# Build the app
RUN npm run build
RUN npm run db:generate

# Run the app
CMD ["npm", "start"]
