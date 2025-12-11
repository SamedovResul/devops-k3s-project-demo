import promClient from 'prom-client';

// Create a Registry which will hold all our metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, event loop lag, etc.)
promClient.collectDefaultMetrics({ 
  register,
  prefix: 'irrigation_backend_'
});

// Custom metrics for your irrigation system

// Counter: Total HTTP requests received
const httpRequestsTotal = new promClient.Counter({
  name: 'irrigation_http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Histogram: HTTP request duration in seconds
const httpRequestDuration = new promClient.Histogram({
  name: 'irrigation_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Counter: Total errors
const errorsTotal = new promClient.Counter({
  name: 'irrigation_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'route'],
  registers: [register]
});

// Counter: Device check-ins
const deviceCheckInsTotal = new promClient.Counter({
  name: 'irrigation_device_checkins_total',
  help: 'Total number of device check-ins received',
  labelNames: ['device_id'],
  registers: [register]
});

// Counter: Sensor readings received
const sensorReadingsTotal = new promClient.Counter({
  name: 'irrigation_sensor_readings_total',
  help: 'Total number of sensor readings received',
  labelNames: ['sensor_type'],
  registers: [register]
});

// Counter: Valve operations
const valveOperationsTotal = new promClient.Counter({
  name: 'irrigation_valve_operations_total',
  help: 'Total number of valve operations (open/close)',
  labelNames: ['operation', 'device_id'],
  registers: [register]
});

// Gauge: Active devices
const activeDevicesGauge = new promClient.Gauge({
  name: 'irrigation_active_devices',
  help: 'Number of devices that checked in within the last 10 minutes',
  registers: [register]
});

// Counter: Database operations
const dbOperationsTotal = new promClient.Counter({
  name: 'irrigation_db_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'collection', 'status'],
  registers: [register]
});

// Histogram: Database operation duration
const dbOperationDuration = new promClient.Histogram({
  name: 'irrigation_db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register]
});

// Counter: Authentication attempts
const authAttemptsTotal = new promClient.Counter({
  name: 'irrigation_auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['status'],
  registers: [register]
});

// Counter: AI chat requests
const aiChatRequestsTotal = new promClient.Counter({
  name: 'irrigation_ai_chat_requests_total',
  help: 'Total number of AI chat requests',
  registers: [register]
});

// Counter: Notifications sent
const notificationsSentTotal = new promClient.Counter({
  name: 'irrigation_notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['type'],
  registers: [register]
});

// Gauge: Water flow rate
const waterFlowRateGauge = new promClient.Gauge({
  name: 'irrigation_water_flow_rate',
  help: 'Current water flow rate',
  labelNames: ['device_id'],
  registers: [register]
});

export {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  errorsTotal,
  deviceCheckInsTotal,
  sensorReadingsTotal,
  valveOperationsTotal,
  activeDevicesGauge,
  dbOperationsTotal,
  dbOperationDuration,
  authAttemptsTotal,
  aiChatRequestsTotal,
  notificationsSentTotal,
  waterFlowRateGauge
};