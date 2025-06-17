# 🚀 Robitesk Frontend – DevOps CI/CD with K3s

**Robitesk** is an engaging STEAM education platform built in Azerbaijan, designed for kids. It offers interactive web and mobile-based courses in robotics, programming, digital art, and science — supporting multilingual access.

This repository contains the **frontend** of the Robitesk platform, developed with **React + Vite**, containerized using **Docker**, and deployed to a **K3s (Kubernetes)** cluster on a **DigitalOcean Ubuntu 22.04** server.

---

## 📦 Tech Stack

- **Frontend:** React.js + Vite
- **Containerization:** Docker
- **CI/CD:** GitHub Actions + GHCR (GitHub Container Registry)
- **Infrastructure:** K3s Kubernetes on Ubuntu 22.04
- **Ingress:** NGINX with TLS via cert-manager + Let’s Encrypt

---

## 📁 Folder Structure

.
├── .github/
│   └── workflows/
│       └── frontend-ci.yml     # GitHub Actions CI/CD pipeline
├── kubernetes/
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   └── ingress.yaml            # Ingress for TLS and domain routing
├── public/                     # Static assets for the React app
├── src/                        # React application source code
├── .Dockerfile                 # Dockerfile for containerizing the app
├── .gitignore
├── README.md
├── package.json
└── package-lock.json

---

## 🚀 CI/CD Workflow

GitHub Actions automates Docker image builds and deployment:

### 🛠 CI (Build)

- Triggered on push to `production` branch
- Builds Docker image using a multi-stage Dockerfile
- Pushes both `:latest` and `:sha` tags to **GitHub Container Registry (GHCR)**

### 🚀 CD (Deploy)

- Authenticates to K3s using a stored `kubeconfig` secret
- Uses `kubectl set image` to update the live deployment
- Performs a rollout restart

> See `.github/workflows/frontend-ci.yml` for details.




