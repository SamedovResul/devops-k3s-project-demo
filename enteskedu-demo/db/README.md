# 🗃️ MongoDB on Kubernetes (K3s)

This folder contains the Kubernetes manifests to deploy a **MongoDB 6.0** instance with **persistent storage**, **environment-based secrets**, and a **ClusterIP service** — designed for use with applications deployed on a **K3s Kubernetes cluster** (e.g., Robitesk backend).

---

## 📦 Tech Stack

- MongoDB 6.0 (Official Docker image)
- Kubernetes (K3s or standard)
- PVC for persistent storage
- Secret-based credential injection

---

## 📁 Folder Structure

```plaintext
.
├── mongo-deployment.yaml     # MongoDB pod and volume config
├── mongo-pvc.yaml            # Persistent storage for data
└── mongo-service.yaml        # ClusterIP service for internal access
