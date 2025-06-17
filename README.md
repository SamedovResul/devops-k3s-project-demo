# 🤖 Robitesk – Full-Stack STEAM Education Platform (DevOps-Ready)

**Robitesk** is an interactive **STEAM education platform** built in Azerbaijan for children aged 7–15. It offers engaging mobile and web-based courses in **robotics**, **programming**, **digital art**, and **science** in multiple languages.

This monorepo (or umbrella project) documents the complete DevOps architecture and infrastructure used to deploy, scale, and manage **Robitesk** using modern cloud-native practices.

---

## 🧱 Architecture Overview

Robitesk is deployed to a **K3s Kubernetes cluster** on a **DigitalOcean Ubuntu 22.04 server**, powered by:

- 🔧 **GitHub Actions CI/CD** (frontend & backend)
- 🐳 **Docker & GitHub Container Registry (GHCR)**
- ☸️ **K3s Kubernetes** with Ingress, Secrets, and Persistent Volumes
- 📡 **NGINX Ingress Controller** with Let’s Encrypt TLS
- 🗃️ **MongoDB** deployed as a Kubernetes-managed stateful service
- 🔐 **Secrets & credentials** securely managed via K8s

---

## 📦 Tech Stack

| Component     | Tech                               |
|--------------|-------------------------------------|
| Frontend      | React.js + Vite                    |
| Backend       | Node.js (Express) + WebSockets     |
| Database      | MongoDB 6.0                        |
| CI/CD         | GitHub Actions + GHCR              |
| Containerization | Docker                          |
| Kubernetes    | K3s on DigitalOcean (Ubuntu 22.04) |
| Ingress       | NGINX + TLS via cert-manager       |
| Storage       | PVCs with local-path               |


---

## 🔁 CI/CD Pipelines (GitHub Actions)

### Frontend CI/CD (`frontend-ci.yml`)

- On push to `production`:
  - Builds Docker image with React frontend
  - Pushes to GitHub Container Registry
  - Connects to DigitalOcean server via `kubeconfig`
  - Updates Kubernetes deployment using `kubectl set image`

### Backend CI/CD (`backend-ci.yml`, optional)

- Similar to frontend (if configured)
- Deploys Node.js server and rolls out updates via `kubectl`

> Secrets like `GHCR_PAT_ROBI`, `DO_KUBECONFIG_RAW`, and DockerHub creds are managed using GitHub Secrets.

---

## ☸️ Kubernetes Deployment

All services are deployed into the same K3s cluster:

### ✅ Frontend

- React app served via NGINX (inside container)
- `frontend-deployment.yaml` + `frontend-service.yaml`
- Exposed at `/` path through Ingress

### ✅ Backend

- Node.js app with WebSocket support
- Persistent log storage via PVC
- Uses `envFrom` to load secret env vars
- Exposed at `/api` and `/socket.io` via Ingress

### ✅ MongoDB

- Stateful pod with PVC (`10Gi`)
- Exposed via `mongo-svc` (ClusterIP)
- Credentials loaded from `mongo-env` secret
- Connection string used in backend:


---

## 🌐 Ingress & TLS

**Ingress Controller** (NGINX) handles:

- Routing:
- `/` → frontend
- `/api`, `/socket.io` → backend
- TLS:
- Certificates issued by Let’s Encrypt
- Auto-renewal with `cert-manager`
- Redirects:
- HTTP → HTTPS
- non-www to www and vice versa


---

## 📂 Secrets & Configs

| Name             | Type       | Purpose                     |
|------------------|------------|-----------------------------|
| `GHCR_PAT_ROBI`  | GitHub Secret | GHCR access for CI/CD   |
| `DO_KUBECONFIG_RAW` | GitHub Secret | Kubeconfig for K3s     |
| `mongo-env`      | K8s Secret | MongoDB root credentials    |
| `ghcr-secret`    | K8s Secret | Docker image pull credentials |

---

## 🚀 Deploying the System

### 1. Build and push images (via GitHub Actions)

Push to `production` branch in each repo triggers auto-deploy.

### 2. Manual Deployment (optional)

```bash

kubectl apply -f backend-pvc.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f mongo-pvc.yaml
kubectl apply -f mongo-deployment.yaml
kubectl apply -f mongo-service.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml
kubectl apply -f ingress.yaml
