# ⚙️ Enteskedu Backend – Node.js + K3s Kubernetes + Persistent Logs

This repository contains the **backend service** of the Enteskedu STEAM education platform — a powerful Node.js API server supporting the platform's content, WebSocket, and data operations.

The backend is containerized with **Docker**, deployed to a **K3s Kubernetes** cluster on a **DigitalOcean Ubuntu 22.04** server, and exposed within the cluster via an internal service. It features persistent logging with Kubernetes volumes and secrets-based environment management.

---

## 📦 Tech Stack

- **Backend Framework:** Node.js
- **Containerization:** Docker + GHCR
- **CI/CD:** GitHub Actions
- **Infrastructure:** K3s Kubernetes on DigitalOcean
- **Storage:** PVC for logs
- **Secrets:** `envFrom` Kubernetes secret injection

---