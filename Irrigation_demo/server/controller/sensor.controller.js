import {
  sensorReadingsTotal,
  errorsTotal,
  dbOperationsTotal,
  dbOperationDuration
} from '../metrics.js';


async function measureDbOperation(operation, collection, asyncFunction) {
  const start = Date.now();
  try {
    const result = await asyncFunction();
    const duration = (Date.now() - start) / 1000;
    
    dbOperationDuration.observe({ operation, collection }, duration);
    dbOperationsTotal.inc({ operation, collection, status: 'success' });
    
    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    
    dbOperationDuration.observe({ operation, collection }, duration);
    dbOperationsTotal.inc({ operation, collection, status: 'error' });
    
    throw error;
  }
}

export const getSensors = async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const sensors = await measureDbOperation('find', 'sensors', async () => {
      return await Model.find({ deviceId });
    });
    
    res.json({ sensors });
  } catch (error) {
    errorsTotal.inc({ 
      type: 'get_sensors_error',
      route: '/api/sensors/all/:deviceId'
    });
    throw error;
  }
};

export const updateSensor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Track sensor reading if it's included in the update
    if (updateData.humidity !== undefined) {
      sensorReadingsTotal.inc({ sensor_type: 'humidity' });
    }
    if (updateData.temperature !== undefined) {
      sensorReadingsTotal.inc({ sensor_type: 'temperature' });
    }
    if (updateData.soilMoisture !== undefined) {
      sensorReadingsTotal.inc({ sensor_type: 'soil_moisture' });
    }
    
    const sensor = await measureDbOperation('update', 'sensors', async () => {
      return await Model.findByIdAndUpdate(id, updateData, { new: true });
    });
    
    if (!sensor) {
      return res.status(404).json({ message: "Sensor not found" });
    }
    
    res.json({ sensor });
  } catch (error) {
    errorsTotal.inc({ 
      type: 'update_sensor_error',
      route: '/api/sensors/:id'
    });
    throw error;
  }
};

export const getLastHumidity = async (req, res) => {
  try {
    const { deviceId } = req.query;
    
    const sensor = await measureDbOperation('findOne', 'sensors', async () => {
      return await Model.findOne({ deviceId })
        .sort({ timestamp: -1 })
        .select('humidity timestamp');
    });
    
    if (!sensor) {
      return res.status(404).json({ message: "No humidity data found" });
    }
    
    res.json({ 
      humidity: sensor.humidity,
      timestamp: sensor.timestamp 
    });
  } catch (error) {
    errorsTotal.inc({ 
      type: 'get_last_humidity_error',
      route: '/api/sensors/last-humidity'
    });
    throw error;
  }
};

export const getMotorStatus = async (req, res) => {
  try {
    const { deviceId } = req.query;
    
    const status = await measureDbOperation('findOne', 'devices', async () => {
      return await Model.findOne({ deviceId }).select('motorStatus');
    });
    
    res.json({ motorStatus: status?.motorStatus || 'off' });
  } catch (error) {
    errorsTotal.inc({ 
      type: 'get_motor_status_error',
      route: '/api/sensors/motor-status'
    });
    throw error;
  }
};

export const getPoolStatus = async (req, res) => {
  try {
    const { deviceId } = req.query;
    
    const status = await measureDbOperation('findOne', 'pools', async () => {
      return await Model.findOne({ deviceId }).select('status waterLevel');
    });
    
    res.json({ 
      status: status?.status || 'unknown',
      waterLevel: status?.waterLevel || 0
    });
  } catch (error) {
    errorsTotal.inc({ 
      type: 'get_pool_status_error',
      route: '/api/sensors/pool-status'
    });
    throw error;
  }
};