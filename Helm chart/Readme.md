# NGINX Ingress Controller Helm Chart

A custom Helm chart for deploying NGINX Ingress Controller on Kubernetes.

## Prerequisites

- Docker Desktop with Kubernetes enabled
- Helm 3.x installed
- kubectl configured

## Project Structure

```
infra-nginx-ingress-trial/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    ├── serviceaccount.yaml
    ├── ingressclass.yaml
    └── rbac.yaml
```

## Installation

### 1. Clone/Navigate to the chart directory

```bash
cd payever-task
```

### 2. Install the Helm chart

```bash
helm install my-ingress ./
```

### 3. Verify the deployment

```bash
kubectl get pods
kubectl get svc
kubectl get ingressclass
```

## Configuration

Key configuration options in `values.yaml`:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `2` |
| `image.repository` | Image repository | `registry.k8s.io/ingress-nginx/controller` |
| `image.tag` | Image tag | `v1.9.6` |
| `service.type` | Service type | `LoadBalancer` |
| `service.port` | Service port | `80` |
| `ingressClass.name` | IngressClass name | `nginx-trial` |
| `resources.requests.cpu` | CPU request | `100m` |
| `resources.requests.memory` | Memory request | `128Mi` |
| `resources.limits.cpu` | CPU limit | `500m` |
| `resources.limits.memory` | Memory limit | `512Mi` |

## Useful Commands

```bash
# List Helm releases
helm list

# Check pod status
kubectl get pods

# View logs
kubectl logs -l app=my-ingress-nginx-ingress

# Uninstall the chart
helm uninstall my-ingress

# Upgrade after changes
helm upgrade my-ingress ./
```

## Testing

After deployment, access the ingress controller:

```bash
curl http://localhost
```

Or open http://localhost in your browser.

## Components Created

- **Deployment**: 2 replicas of NGINX Ingress Controller
- **Service**: LoadBalancer exposing port 80
- **ServiceAccount**: For pod authentication
- **IngressClass**: Named `nginx-trial`
- **ClusterRole & ClusterRoleBinding**: RBAC permissions

## Author

Created as part of infrastructure trial task.

## License

MIT