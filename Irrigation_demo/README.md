# ⚙️ irrigation Backend (Node.js + Helm + K3s)

This is the backend API service for the **irrigation** smart irrigation system — a mobile-controlled platform that enables remote irrigation scheduling, soil sensor integration, MQTT-based device communication, and LLM-based watering recommendations.

The backend is built using **Node.js (JavaScript)**, containerized with **Docker**, and deployed to a **K3s Kubernetes cluster** on a DigitalOcean Ubuntu server using **Helm**. It supports real-time communication via MQTT and WebSockets, secure secret management, persistent logging, and scalable deployment.

---

## 🧰 Tech Stack

| Category | Technology |
|----------|------------|
| **Backend** | Node.js (Express, JavaScript) |
| **Database** | MongoDB 6.0 |
| **MQTT Broker** | Eclipse Mosquitto 2.0 |
| **Containerization** | Docker + GitHub Container Registry (GHCR) |
| **CI/CD** | GitHub Actions + Helm |
| **Infrastructure** | Kubernetes (K3s) on DigitalOcean |
| **Ingress** | NGINX Ingress Controller + cert-manager |
| **Monitoring** | Prometheus, Grafana, Alertmanager |
| **Security** | Kubernetes Secrets + TLS (Let's Encrypt) |

---

## 🏗️ Architecture

```
                    ESP32 Devices                     Mobile App
                         │                                │
                    [MQTT TCP]                      [REST / Socket.IO]
                    port 31883                        port 443
                         │                                │
                         ▼                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NGINX Ingress (TLS)                             │
│                  api.irrigation.com                               │
│         /api, /socket.io → Backend    /mqtt → Mosquitto             │
└────────────────────────┬──────────────────────┬─────────────────────┘
                         │                      │
                         ▼                      ▼
                 ┌───────────────┐     ┌─────────────────┐
                 │   Backend     │────▶│  MQTT Broker     │
                 │  (Node.js)   │     │  (Mosquitto)     │
                 │  port 4000   │     │  port 1883       │
                 └──────┬───────┘     └──────────────────┘
                        │
                        ▼
                 ┌───────────────┐
                 │   MongoDB     │
                 │  port 27017   │
                 └───────────────┘
```

---

## 🚀 Key Features

- 🔐 Secure secret management via `envFrom` in Kubernetes
- 📡 Real-time device communication via MQTT (Mosquitto)
- 🌱 Real-time soil data ingestion for irrigation logic
- 📦 Persistent log storage using PVC (`/app/logs`)
- 🧠 AI (LLM) support for dynamic watering advice
- ♻️ Zero-downtime deployment with Helm (`--atomic` rollback)
- 🌐 TLS-enabled routing using Ingress and Let's Encrypt
- 📊 Comprehensive Prometheus metrics for observability
- 🔌 WebSocket support via Socket.IO

---

## ☸️ Helm Chart

The entire stack is managed via a single Helm chart in `irrigation-helm/`.

### Chart Structure

```
irrigation-helm/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── backend-deployment.yaml
    ├── backend-service.yaml
    ├── backend-pvc.yaml
    ├── mongodb-deployment.yaml
    ├── mongodb-service.yaml
    ├── mongodb-pvc.yaml
    ├── mqtt-deployment.yaml
    ├── mqtt-service.yaml
    ├── mqtt-configmap.yaml
    ├── mqtt-pvc.yaml
    ├── mqtt-nodeport.yaml
    ├── ingress.yaml
    ├── monitoring-ingress.yaml
    ├── custom-rules.yaml
    ├── pod-alerts.yaml
    └── simple-test-rule.yaml
```

### Resources Created

| Resource | Name | Purpose |
|----------|------|---------|
| Deployment | `irrigation-backend` | Node.js API server |
| Deployment | `irrigation-mongo` | MongoDB 6.0 database |
| Deployment | `irrigation-mqtt` | Mosquitto MQTT broker |
| Service | `irrigation-backend` | port 80 → 4000 |
| Service | `irrigation-mongo` | port 27017 |
| Service | `irrigation-mqtt` | ports 1883 + 9001 |
| Service | `irrigation-mqtt-external` | NodePort 31883 for ESP32 devices |
| Ingress | `irrigation-ingress` | HTTPS routing for API, Socket.IO, MQTT WebSocket |
| Ingress | `irrigation-monitoring-ingress` | Grafana + Prometheus UI |
| PVC | `irrigation-backend-logs-pvc` | Backend logs (1Gi) |
| PVC | `irrigation-mongo-pvc` | MongoDB data (10Gi) |
| PVC | `irrigation-mqtt-pvc` | MQTT persistence (1Gi) |

---

## 📡 MQTT Communication

### Connection Endpoints

| Who | Protocol | URL |
|-----|----------|-----|
| ESP32 devices | MQTT TCP | `mqtt://api.irrigation.com:11111` |
| Backend (internal) | MQTT TCP | `mqtt://irrigation-mqtt:111111` |
| Web/Browser | MQTT WebSocket | `wss://api.irrigation.com/mqtt` |
| Local development | MQTT WebSocket | `wss://api.irrigation.com/mqtt` |

### Topic Structure

```
irrigation/{deviceId}/sensors   → device publishes sensor data
irrigation/{deviceId}/command   → server publishes commands to device
irrigation/{deviceId}/status    → device confirms command execution
```

### Backend MQTT Configuration

```JavaScript
const options =
  config.nodeEnv === "production"
    ? {
        username: config.mqtt.username,
        password: config.mqtt.password,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
        protocol: "mqtt" as const,
      }
    : {
        username: config.mqtt.username || undefined,
        password: config.mqtt.password || undefined,
        reconnectPeriod: 3000,
        connectTimeout: 10000,
        rejectUnauthorized: false,
        protocol: "wss" as const,
      };
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

### Trigger

- On push to `production` branch

### Pipeline Steps

1. **Build** — Build Docker image and push to GHCR
2. **Deploy** — Run `helm upgrade` with new image tag via kubeconfig

```yaml
# Deploy step
helm upgrade irrigation ./irrigation-helm \
  --set backend.image.tag=${{ github.sha }} \
  --atomic \
  --timeout 120s
```

The `--atomic` flag ensures automatic rollback if the new deployment fails.

### GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `GHCR_PAT_ROBI` | GitHub Container Registry token |
| `DO_KUBECONFIG_RAW` | Raw kubeconfig for K3s cluster access |

---

## 📊 Metrics & Observability

### Metrics Endpoint

```
GET /metrics
```

Exposes all metrics in Prometheus format for scraping.

### Custom Application Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `irrigation_http_requests_total` | Counter | Total HTTP requests by method, route, status |
| `irrigation_http_request_duration_seconds` | Histogram | Request duration |
| `irrigation_device_checkins_total` | Counter | Device check-ins by device_id |
| `irrigation_active_devices` | Gauge | Devices active in last 10 minutes |
| `irrigation_sensor_readings_total` | Counter | Sensor readings by type |
| `irrigation_water_flow_rate` | Gauge | Current water flow rate per device |
| `irrigation_valve_operations_total` | Counter | Valve open/close operations |
| `irrigation_db_operations_total` | Counter | Database operations by collection |
| `irrigation_db_operation_duration_seconds` | Histogram | Database operation latency |
| `irrigation_auth_attempts_total` | Counter | Auth attempts (success/failure) |
| `irrigation_ai_chat_requests_total` | Counter | AI/LLM chat requests |
| `irrigation_errors_total` | Counter | Application errors by type |

### Alert Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| PodHighCPU | CPU > 80% for 10m | warning |
| PodCrashLooping | Restart rate > 0.1/5m for 10m | warning |
| PodNotRunning | Failed/Unknown/Pending for 5m | critical |

### Monitoring Access

| Service | URL |
|---------|-----|
| Grafana | `https://monitoring.irrigation.com/` |
| Prometheus | `https://monitoring.irrigation.com/prometheus` |

---

## 🛠️ Deployment Guide

### Prerequisites

- K3s cluster running
- Helm 3 installed
- NGINX Ingress Controller
- cert-manager with ClusterIssuer

### 1. Create Kubernetes Secrets

```bash
# GitHub Container Registry pull secret
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USER \
  --docker-password=YOUR_GITHUB_TOKEN

# Backend environment variables
kubectl create secret generic backend-env \
  --from-literal=MONGO_URI=mongodb://irrigation-mongo:27017/irrigation \
  --from-literal=MQTT_BROKER_URL=mqtt://irrigation-mqtt:1883 \
  --from-literal=MQTT_USERNAME=irrigation \
  --from-literal=MQTT_PASSWORD=YOUR_MQTT_PASSWORD \
  --from-literal=NODE_ENV=production
  # ... add other env vars

# MongoDB credentials
kubectl create secret generic mongo-env \
  --from-literal=MONGO_INITDB_ROOT_USERNAME=admin \
  --from-literal=MONGO_INITDB_ROOT_PASSWORD=YOUR_MONGO_PASSWORD

# MQTT password file
kubectl create secret generic mqtt-password \
  --from-literal=passwordfile='irrigation:HASHED_PASSWORD'
```

### 2. Apply Cluster Issuer

```bash
kubectl apply -f cluster-issuer.yaml
```

### 3. Deploy with Helm

```bash
cd irrigation-helm
helm lint .
helm install irrigation .
```

### 4. Verify

```bash
kubectl get pods,svc,pvc,ingress
```

### 5. Upgrade

```bash
helm upgrade irrigation .
```

---

## 🛠️ Local Development

### Prerequisites

- Node.js 18+
- MongoDB
- Docker (optional)

### Setup

```bash
npm install
cp .env.irrigation .env
npm run dev
```


### Test Endpoints

```bash
# API
curl http://localhost:4000/api

# Metrics
curl http://localhost:4000/metrics
```

---

## 🔐 Security

- All sensitive variables injected via Kubernetes Secrets
- TLS enforced at ingress level using cert-manager and Let's Encrypt
- MQTT broker requires username/password authentication
- `.env` file excluded from repo — secrets created manually
- Metrics endpoint does not expose sensitive data
- Internal services (MongoDB, MQTT) accessible only within the cluster

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.