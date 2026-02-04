# ⚙️ Robitesk Backend (Node.js + DevOps K3s Deployment)

This is the **backend API service** powering the Robitesk STEAM education platform — designed for children to explore robotics, programming, digital art, and science.

The backend is built with **Node.js**, containerized using **Docker**, and deployed to a **K3s Kubernetes cluster** on a **DigitalOcean Ubuntu 22.04** server. It supports WebSocket connections, API endpoints, persistent logging, and secure environment management via Kubernetes Secrets.

---

## 🧰 Tech Stack

- **Backend:** Node.js (Express)
- **Containerization:** Docker + GitHub Container Registry (GHCR)
- **CI/CD:** GitHub Actions (optional)
- **Infrastructure:** K3s Kubernetes (DigitalOcean VM)
- **Ingress:** NGINX with TLS
- **Secrets & Config:** Kubernetes `Secret` and `envFrom`
- **Logs:** Kubernetes PersistentVolumeClaim (PVC)

---
## 🚀 Key Features

- 🔐 **Secrets Management** with Kubernetes `envFrom`
- 🧠 **Cluster-Scoped Deployment** with 2 replicas
- 📦 **Persistent Logging** using Kubernetes PVC (mounted to `/app/logs`)
- 🛰️ **WebSocket Support** (`/socket.io`) via Ingress routing
- 🧩 **ClusterIP Service** for secure internal communication
- 🌐 **TLS & Routing** configured through shared NGINX Ingress

---

## ⚙️ Kubernetes Configuration

### ✅ Deployment (`backend-deployment.yaml`)

- Runs 2 replicas
- Pulls Docker image from `ghcr.io/edinify/robi-ser:latest`
- Loads environment variables from a Kubernetes secret `backend-env`
- Mounts logs volume from PVC: `backend-logs-pvc`