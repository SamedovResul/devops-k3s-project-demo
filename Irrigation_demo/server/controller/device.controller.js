import {
  deviceCheckInsTotal,
  errorsTotal,
  dbOperationsTotal,
  dbOperationDuration,
  activeDevicesGauge
} from '../metrics';

// this is helper function 
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

export const checkDeviceConnection = async (req, res) => {
  try {
    const { deviceId } = req.query;
    
    // Track this as a device check-in
    if (deviceId) {
      deviceCheckInsTotal.inc({ device_id: deviceId });
    }
    

    const device = await measureDbOperation('findOne', 'devices', async () => {
      return await Model.findOne({ deviceId });
    });
    
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }
    
    // Update last seen timestamp
    await measureDbOperation('update', 'devices', async () => {
      return await Model.findByIdAndUpdate(device._id, { 
        lastSeen: new Date() 
      });
    });
    
    // Update active devices gauge periodically
    updateActiveDevicesCount();
    
    res.json({ 
      connected: true, 
      device 
    });
  } catch (error) {
    errorsTotal.inc({ 
      type: 'device_connection_check_error',
      route: '/api/device/connection'
    });
    throw error;
  }
};

export const getDevices = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const devices = await measureDbOperation('find', 'devices', async () => {
      return await Model.find({ userId });
    });
    
    res.json({ devices });
  } catch (error) {
    errorsTotal.inc({ 
      type: 'get_devices_error',
      route: '/api/device'
    });
    throw error;
  }
};

export const addDevice = async (req, res) => {
  try {
    const { deviceId, name, hardwareId } = req.body;
    const userId = req.user._id;
    
    const device = await measureDbOperation('insert', 'devices', async () => {
      return await Model.create({
        deviceId,
        name,
        hardwareId,
        userId,
        lastSeen: new Date()
      });
    });
    
    // Update active devices count
    updateActiveDevicesCount();
    
    res.status(201).json({ device });
  } catch (error) {
    errorsTotal.inc({ 
      type: 'add_device_error',
      route: '/api/device'
    });
    throw error;
  }
};

export const updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const device = await measureDbOperation('update', 'devices', async () => {
      return await Model.findByIdAndUpdate(id, updateData, { new: true });
    });
    
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }
    
    res.json({ device });
  } catch (error) {
    errorsTotal.inc({ 
      type: 'update_device_error',
      route: '/api/device/:id'
    });
    throw error;
  }
};

export const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    
    const device = await measureDbOperation('delete', 'devices', async () => {
      return await Model.findByIdAndDelete(id);
    });
    
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }
    
    // Update active devices count
    updateActiveDevicesCount();
    
    res.json({ message: "Device deleted successfully" });
  } catch (error) {
    errorsTotal.inc({ 
      type: 'delete_device_error',
      route: '/api/device/:id'
    });
    throw error;
  }
};

export const getVersionByDevice = async (req, res) => {
  try {
    const { deviceId } = req.query;
    
    const version = await measureDbOperation('findOne', 'devices', async () => {
      return await Model.findOne({ deviceId }).select('version');
    });
    
    res.json({ version: version?.version || '1.0.0' });
  } catch (error) {
    errorsTotal.inc({ 
      type: 'get_version_error',
      route: '/api/device/version-by-device'
    });
    throw error;
  }
};

// Helper function to update active devices count
async function updateActiveDevicesCount() {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const count = await Device.countDocuments({
      lastSeen: { $gte: tenMinutesAgo }
    });
    activeDevicesGauge.set(count);
  } catch (error) {
    console.error('Error updating active devices gauge:', error);
  }
}