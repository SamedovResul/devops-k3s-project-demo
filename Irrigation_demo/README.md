# ⚙️ AzIrrigation Backend (Node.js + DevOps K3s Deployment)

This is the backend API service for the **AzIrrigation** smart irrigation system — a mobile-controlled platform that enables remote irrigation scheduling, soil sensor integration, and LLM-based watering recommendations.

The backend is built using **Node.js**, containerized with **Docker**, and deployed to a **K3s Kubernetes cluster** on an AWS EC2 Ubuntu 22.04 instance. It supports real-time communication (WebSockets), secure secret management, persistent logging, and scalable deployment.

---

## 🧰 Tech Stack

| Category | Technology |
|----------|------------|
| **Backend** | Node.js (Express) |
| **Database** | MongoDB |
| **Containerization** | Docker + GitHub Container Registry (GHCR) |
| **CI/CD** | GitHub Actions |
| **Infrastructure** | Kubernetes (K3s) on AWS EC2 |
| **Ingress** | NGINX Ingress Controller + cert-manager |
| **Monitoring** | Prometheus, Grafana, Alertmanager |
| **Security** | Kubernetes Secrets + TLS |

---

## 🚀 Key Features

- 🔐 Secure secret management via `envFrom` in Kubernetes
- 🌱 Real-time soil data ingestion for irrigation logic
- 📦 Persistent log storage using PVC (`/app/logs`)
- 🧠 AI (LLM) support for dynamic watering advice
- ♻️ Zero-downtime deployment with 2 backend replicas
- 🧩 Internal-only service via ClusterIP (`backend-svc`)
- 🌐 TLS-enabled routing using Ingress and Let's Encrypt
- 📊 Comprehensive Prometheus metrics for observability

---

## 📊 Metrics & Observability

The backend includes a comprehensive **Prometheus metrics** setup for full observability of the irrigation system.

### Metrics Endpoint

```
GET /metrics
```

Exposes all metrics in Prometheus format for scraping.

### Default Node.js Metrics

All default metrics are prefixed with `irrigation_backend_`:
- CPU usage
- Memory usage (heap, RSS)
- Event loop lag
- Active handles/requests
- GC statistics

### Custom Application Metrics

#### HTTP Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `irrigation_http_requests_total` | Counter | `method`, `route`, `status_code` | Total HTTP requests received |
| `irrigation_http_request_duration_seconds` | Histogram | `method`, `route`, `status_code` | Request duration in seconds |

#### Device Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `irrigation_device_checkins_total` | Counter | `device_id` | Total device check-ins received |
| `irrigation_active_devices` | Gauge | - | Devices active in last 10 minutes |

#### Sensor Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `irrigation_sensor_readings_total` | Counter | `sensor_type` | Sensor readings by type (`humidity`, `temperature`, `soil_moisture`) |
| `irrigation_water_flow_rate` | Gauge | `device_id` | Current water flow rate per device |

#### Valve Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `irrigation_valve_operations_total` | Counter | `operation`, `device_id` | Valve operations (`open`/`close`) |

#### Database Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `irrigation_db_operations_total` | Counter | `operation`, `collection`, `status` | DB operations (`find`, `insert`, `update`, `delete`) |
| `irrigation_db_operation_duration_seconds` | Histogram | `operation`, `collection` | DB operation latency |

#### Application Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `irrigation_auth_attempts_total` | Counter | `status` | Authentication attempts (`success`/`failure`) |
| `irrigation_ai_chat_requests_total` | Counter | - | AI/LLM chat requests |
| `irrigation_notifications_sent_total` | Counter | `type` | Notifications sent by type |
| `irrigation_errors_total` | Counter | `type`, `route` | Application errors |

### Instrumented Controllers

| Controller | Metrics Tracked |
|------------|-----------------|
| `device.controller.js` | Device check-ins, active devices gauge, DB operations |
| `sensor.controller.js` | Sensor readings by type, DB operations |
| `valve.controller.js` | Valve open/close operations, DB operations |

### Metrics Middleware

The `metricsMiddleware.js` automatically captures:
- Request method
- Route pattern (normalized, e.g., `/api/device/:id`)
- Response status code
- Request duration

```javascript
// Automatically applied to all routes
app.use(metricsMiddleware);
```

### Histogram Buckets

**HTTP Request Duration:**
```
[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5] seconds
```

**DB Operation Duration:**
```
[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2] seconds
```

---

## ☸️ Kubernetes Configuration

### ✅ Deployment (`backend-deployment.yaml`)

- 2 replicas running Node.js containers
- Docker image pulled from `ghcr.io/azirrigation/backend:latest`
- Uses Kubernetes Secret `backend-env` for environment variables
- Mounts persistent volume `backend-logs-pvc` for `/app/logs`

### ✅ PVC (`backend-pvc.yaml`)

- Provisioned **5Gi** of persistent storage
- Storage class: `local-path`

### ✅ Service (`backend-service.yaml`)

- Type: `ClusterIP`
- Port **80** routed to container port **4000**

### ✅ Prometheus Scrape Configuration

Pod annotations for Prometheus auto-discovery:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "4000"
  prometheus.io/path: "/metrics"
```

---

## 📁 Project Structure

```
azirrigation-backend/
├── .github/
│   └── workflows/
│       └── backend-ci.yml
├── kubernetes/
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   └── backend-pvc.yaml
├── server/
│   ├── controller/
│   │   ├── device.controller.js
│   │   ├── sensor.controller.js
│   │   └── valve.controller.js
│   ├── middleware/
│   │   └── metricsMiddleware.js
│   └── metrics.js
├── Dockerfile
├── index.js
├── package.json
├── .gitignore
└── README.md
```

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

| Secret | Description |
|--------|-------------|
| `GHCR_PAT` | GitHub Container Registry token |
| `K3S_CONFIG_RAW` | Raw Kubeconfig for K3s cluster access |

---

## 📦 Monitoring & Alerting

This backend is monitored via:

| Tool | Purpose |
|------|---------|
| **Prometheus** | Metrics collection (CPU, memory, custom irrigation metrics) |
| **Grafana** | Real-time dashboards and visualization |
| **Alertmanager** | Threshold-based notifications |

### Example Prometheus Queries

```promql
# Request rate (per second)
rate(irrigation_http_requests_total[5m])

# Average request duration
rate(irrigation_http_request_duration_seconds_sum[5m]) / rate(irrigation_http_request_duration_seconds_count[5m])

# Error rate percentage
sum(rate(irrigation_http_requests_total{status_code=~"5.."}[5m])) / sum(rate(irrigation_http_requests_total[5m])) * 100

# Active devices
irrigation_active_devices

# Valve operations per hour
increase(irrigation_valve_operations_total[1h])

# DB operation latency (p95)
histogram_quantile(0.95, rate(irrigation_db_operation_duration_seconds_bucket[5m]))

# Sensor readings by type
sum by (sensor_type) (rate(irrigation_sensor_readings_total[5m]))
```

All alert rules and dashboards are configured in the `metrics/` and `alerting/` directories of the main project repo.

---

## 🔐 Security Best Practices

- ✅ All sensitive variables (e.g., DB URIs, tokens) are injected via Kubernetes Secrets
- ✅ TLS is enforced at ingress level using `cert-manager` and Let's Encrypt
- ✅ `.env` file is not included in the repo — secrets must be created manually
- ✅ Metrics endpoint does not expose sensitive data

---

## 🛠️ Local Development

### Prerequisites

- Node.js 18+
- MongoDB
- Docker (optional)

### Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

### Test Metrics Endpoint

```bash
curl http://localhost:4000/metrics
```

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.
