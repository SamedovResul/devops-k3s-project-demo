FROM node:20-alpine AS build

WORKDIR /app

# 1️⃣ Copy dependency manifests and install exactly once
COPY package*.json ./
RUN npm ci

# 2️⃣ Copy the rest of the source and build for production
COPY . .
RUN npm run build          # --> outputs static files to /app/dist

#########################
# --- 2. Serve stage  ---
#########################
FROM nginx:1.25-alpine AS prod
#  node:alpine with `vite preview`, swap the base image.

# 3️⃣ Copy built assets only (no node_modules, no source code)
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf 

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
