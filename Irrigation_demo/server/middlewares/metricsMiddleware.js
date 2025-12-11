import { httpRequestsTotal, httpRequestDuration } from '../metrics.js';

export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  // Store the original functions
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  
  // Track when response is sent
  const recordMetrics = () => {
    const duration = (Date.now() - start) / 1000;
    
    // Get the base route pattern (e.g., /api/device instead of /api/device/12345)
    let route = req.baseUrl || req.path;
    if (req.route) {
      route = req.baseUrl + req.route.path;
    }
    
    // Record the metrics
    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode
    });
    
    httpRequestDuration.observe({
      method: req.method,
      route: route,
      status_code: res.statusCode
    }, duration);
  };
  
  // Override res.json
  res.json = function(body) {
    recordMetrics();
    return originalJson(body);
  };
  
  // Override res.send
  res.send = function(body) {
    recordMetrics();
    return originalSend(body);
  };
  
  next();
}