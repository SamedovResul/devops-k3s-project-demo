FROM node:18-alpine
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install --production

# Copy your code
COPY . .

# Tell Kubernetes what port your app uses
ENV PORT=4000
EXPOSE 4000

# Launch Node directly
CMD ["node", "index.js"]
