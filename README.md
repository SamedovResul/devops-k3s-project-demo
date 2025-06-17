# 🚀 Enteskedu Frontend (React + DevOps K3s Deployment)

**Enteskedu** is an engaging mobile and web-based **STEAM education platform** from Azerbaijan designed for kids.  
It offers interactive courses in **robotics**, **programming**, **digital art**, **science**, and supports multiple languages.

This repository contains the **frontend client** of Enteskedu, built with **React + Vite** and deployed to a **K3s Kubernetes cluster** on a **DigitalOcean Ubuntu 22.04 server** using a GitHub Actions CI/CD pipeline.

---

## 🌐 Live Application

> This application is currently deployed via Kubernetes Ingress with a domain name (not publicly shared here).

---

## 🧰 Tech Stack

- **React.js + Vite** (Frontend)
- **Docker**
- **GitHub Actions** (CI/CD)
- **K3s Kubernetes** (on Ubuntu 22.04 / DigitalOcean)
- **Ingress Controller** (for domain routing)

---

## ⚙️ CI/CD Pipeline

Automated using GitHub Actions:  
File: `.github/workflows/frontend-ci.yml`

### 🛠 CI
- On push to `main`, the pipeline:
  - Builds Docker image
  - Pushes to Docker Hub

### 🚀 CD
- Connects to remote Ubuntu server via SSH
- Runs `kubectl apply` to deploy new changes to the K3s cluster
- Uses `Ingress` to serve the frontend via a custom domain

---

## 📁 Project Structure

