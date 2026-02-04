import {
  valveOperationsTotal,
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

export const getValveConfigByUserId = async (req, res) => {
  try {
    const userId = req._id;
    
    const valveConfigs = await measureDbOperation('find', 'valveConfigs', async () => {
      return await Model.find({ userId });
    });
    
    res.json({ valveConfigs });
  } catch (error) {
    errorsTotal.inc({ 
      type: 'get_valve_config_error',
      route: '/api/valveConfig'
    });
    throw error;
  }
};

export const getValveConfigByHardwareId = async (req, res) => {
  try {
    const { hardwareId } = req.query;
    
    const valveConfig = await measureDbOperation('findOne', 'valveConfigs', async () => {
      return await Model.findOne({ hardwareId });
    });
    
    if (!valveConfig) {
      return res.status(404).json({ message: "Valve config not found" });
    }
    
    res.json({ valveConfig });
  } catch (error) {
    errorsTotal.inc({ 
      type: 'get_valve_config_by_hardware_error',
      route: '/api/valveConfig/by-hardware-id'
    });
    throw error;
  }
};

export const updateValveConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Track valve operation if status is being changed
    if (updateData.status) {
      const operation = updateData.status === 'open' ? 'open' : 'close';
      valveOperationsTotal.inc({ 
        operation,
        device_id: updateData.deviceId || 'unknown'
      });
    }
    
    const valveConfig = await measureDbOperation('update', 'valveConfigs', async () => {
      return await Model.findByIdAndUpdate(id, updateData, { new: true });
    });
    
    if (!valveConfig) {
      return res.status(404).json({ message: "Valve config not found" });
    }
    
    res.json({ valveConfig });
  } catch (error) {
    errorsTotal.inc({ 
      type: 'update_valve_config_error',
      route: '/api/valveConfig/:id'
    });
    throw error;
  }
};