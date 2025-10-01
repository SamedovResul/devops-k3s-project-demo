# 🌐 DevOps Portfolio Projects – Robitesk & Azirrigation

This repository demonstrates real-world DevOps practices implemented across **two production-grade projects**: a learning platform (**Robitesk**) and an IoT smart irrigation system (**Azirrigation**). Both projects are fully containerized, monitored, and deployed using modern DevOps tools like Kubernetes, GitHub Actions, Docker, Prometheus, and Grafana.



## 📘 Project 1: Robitesk – LMS Platform (Web + DevOps)

Robitesk is a mobile and web-based STEAM education platform for children, offering interactive courses in robotics, programming, digital art, and science.

### 🔧 Tech Stack
- **Frontend:** React.js + Vite
- **Backend:** Node.js (Express + Socket.io)
- **Database:** MongoDB
- **CI/CD:** GitHub Actions
- **Infra:** Kubernetes (K3s) on DigitalOcean
- **Ingress:** NGINX with TLS via cert-manager
- **Containerization:** Docker + GHCR
- **Monitoring:** Prometheus, Grafana
- **Alerting:** Alertmanager

### ✅ DevOps Highlights
- CI/CD pipeline automatically builds Docker images and deploys via `kubectl`
- TLS-secured Ingress with WebSocket support
- Persistent Volume Claims for backend logs and MongoDB
- Monitoring dashboards via Grafana + Prometheus
- Multi-env support with Kubernetes Secrets

### 📂 Key Folders
robitesk/
├── client/ # React + Vite frontend
├── server/ # Node.js backend
├── mongo/ # MongoDB K8s setup
├── metrics/ # Grafana, Prometheus config
├── alerting/ # Alertmanager rules

markdown
Copy code

---

## 📗 Project 2: Azirrigation – Smart Irrigation Platform

Azirrigation is a smart irrigation system designed for both gardens and large-scale fields. It collects soil data and uses AI (LLM) to optimize watering schedules. Control is managed via a mobile app (React Native).

### 🔧 Tech Stack
- **Backend:** Node.js (Express)
- **Client:** React Native (mobile only)
- **Database:** MongoDB
- **Infra:** Kubernetes (K3s) on AWS EC2
- **Monitoring:** Prometheus, Grafana, Alertmanager
- **CI/CD:** GitHub Actions
- **Secrets:** Managed via Kubernetes Secrets
- **Persistence:** PVC for logs and MongoDB

### ✅ DevOps Highlights
- Real-time metrics collection using Prometheus
- Grafana dashboards accessible via secure Ingress
- Custom alert rules for resource usage and pod health
- TLS-secured services via NGINX Ingress + cert-manager
- Modular repo structure (backend, db, metrics, alerting)

### 📂 Key Folders
azirrigation/
├── server/ # Node.js backend + CI/CD
├── db/ # MongoDB deployment + PVC
├── metrics/ # Grafana + Prometheus configs
├── alerting/ # Prometheus alert rules

yaml
Copy code

---

## 📈 Monitoring & Alerting (Both Projects)
- ✅ Prometheus scrape configurations
- ✅ Grafana dashboards for frontend/backend/mongo
- ✅ Alertmanager with memory, pod, and custom alert rules
- ✅ Ingress rules for Prometheus and Grafana via HTTPS

---

## 📦 CI/CD Pipeline (Shared Structure)
- Trigger: Push to `production` branch
- Build: Docker image via GitHub Actions
- Push: Upload image to GitHub Container Registry (GHCR)
- Deploy: SSH + `kubectl set image` + rollout restart

---

## 🛡️ Security Best Practices
- No hardcoded secrets — all secrets injected via Kubernetes `envFrom`
- Kubeconfig & GHCR credentials are stored as GitHub Secrets
- Ingress uses Let's Encrypt via cert-manager for TLS termination
