# ⚙️ Azirrigation Backend (Node.js + DevOps K3s Deployment)

This is the **backend API service** for the **Azirrigation** smart irrigation system — a mobile-controlled platform that enables remote irrigation scheduling, soil sensor integration, and LLM-based watering recommendations.

The backend is built using **Node.js**, containerized with **Docker**, and deployed to a **K3s Kubernetes cluster** on an **AWS EC2 Ubuntu 22.04** instance. It supports real-time communication (WebSockets), secure secret management, persistent logging, and scalable deployment.

---

## 🧰 Tech Stack

- **Backend:** Node.js (Express)
- **Database:** MongoDB
- **Containerization:** Docker + GitHub Container Registry (GHCR)
- **CI/CD:** GitHub Actions
- **Infrastructure:** Kubernetes (K3s) on AWS EC2
- **Ingress:** NGINX Ingress Controller with cert-manager
- **Monitoring:** Prometheus, Grafana, Alertmanager
- **Security:** Kubernetes Secrets + TLS

---

## 🚀 Key Features

- 🔐 Secure secret management via `envFrom` in Kubernetes
- 🌱 Real-time soil data ingestion for irrigation logic
- 📦 Persistent log storage using PVC (`/app/logs`)
- 🧠 AI (LLM) support for dynamic watering advice
- ♻️ Zero-downtime deployment with 2 backend replicas
- 🧩 Internal-only service via ClusterIP (`backend-svc`)
- 🌐 TLS-enabled routing using Ingress and Let's Encrypt

---

## ☸️ Kubernetes Configuration

### ✅ Deployment (`backend-deployment.yaml`)
- 2 replicas running Node.js containers
- Docker image pulled from `ghcr.io/azirrigation/***-**r:latest`
- Uses Kubernetes Secret `backend-env` for environment variables
- Mounts persistent volume `backend-logs-pvc` for `/app/logs`

### ✅ PVC (`backend-pvc.yaml`)
- Provisioned 5Gi of persistent storage
- Storage class: `local-path`

### ✅ Service (`backend-service.yaml`)
- Type: `ClusterIP`
- Port 80 routed to container port 4000

---

## 📁 Project Structure

azirrigation-backend/
├── .github/
│ └── workflows/
│ └── backend-ci.yml
├── kubernetes/
│ ├── backend-deployment.yaml
│ ├── backend-service.yaml
│ └── backend-pvc.yaml
├── Dockerfile
├── index.js
├── package.json
├── .gitignore
└── README.md


---

## 🔄 CI/CD Pipeline (GitHub Actions)

### Trigger
- On push to `production` branch

### Steps
1. Build Docker image from backend
2. Push image to GitHub Container Registry (GHCR)
3. SSH into the K3s server and deploy using `kubectl set image`
4. Roll out restart to apply the new image

### Secrets Used
- `****_PAT`: GitHub Container Registry token
- `**_*****_RAW`: Raw Kubeconfig for K3s cluster access

---

## 📦 Monitoring & Alerting

This backend is monitored via:

- **Prometheus**: CPU, memory, and custom metrics
- **Grafana**: Real-time dashboards
- **Alertmanager**: Threshold-based notifications

All alert rules and dashboards are configured in the `metrics/` and `alerting/` directories of the main project repo.

---

## 🔐 Security Best Practices

- All sensitive variables (e.g., DB URIs, tokens) are injected via Kubernetes Secrets
- TLS is enforced at ingress level using `cert-manager` and Let's Encrypt
- `.env` file is not included in the repo — secrets must be created manually
