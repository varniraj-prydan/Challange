import { useState, useEffect } from 'react';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    loadJsonlData();
  }, []);

  const loadJsonlData = async () => {
    try {
      const response = await fetch('/device_stream_20min.jsonl');
      const text = await response.text();
      const lines = text.trim().split('\n');
      const parsedData = lines.map(line => JSON.parse(line));
      setData(parsedData);
      setCurrentData(parsedData[parsedData.length - 1]);
    } catch (error) {
      console.error('Error loading JSONL data:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OK': return 'bg-green-500';
      case 'WARNING': return 'bg-yellow-500';
      case 'FAULT': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'RUN': return 'bg-green-500';
      case 'IDLE': return 'bg-yellow-500';
      case 'STOP': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateKPIs = () => {
    if (!data.length) return {};
    
    const recent = data.slice(-300); // Last 5 minutes at 1Hz
    const avgPower = recent.reduce((sum, d) => sum + d.kw, 0) / recent.length;
    const maxTemp = Math.max(...recent.map(d => d.temp_c));
    const energyDelta = recent[recent.length - 1]?.kwh_total - recent[0]?.kwh_total;
    const countDelta = recent[recent.length - 1]?.count_total - recent[0]?.count_total;
    
    return {
      avgPower: avgPower.toFixed(2),
      maxTemp: maxTemp.toFixed(1),
      energyDelta: energyDelta?.toFixed(3) || 0,
      countDelta: countDelta || 0
    };
  };

  const kpis = calculateKPIs();

  if (!currentData) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Machine Dashboard</h1>
            <p className="text-gray-600">Machine: {currentData.machine_id}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-white text-sm ${getStateColor(currentData.state)}`}>
              {currentData.state}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-sm">
              {currentData.mode}
            </span>
            <span className={`px-3 py-1 rounded-full text-white text-sm ${getStatusColor(currentData.status)}`}>
              {currentData.status}
            </span>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
              <span className="text-sm text-gray-600">{isLive ? 'Live' : 'Replay'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Live Power</h3>
          <p className="text-3xl font-bold text-blue-600">{currentData.kw} kW</p>
          <p className="text-sm text-gray-500">Avg 5min: {kpis.avgPower} kW</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Energy Consumed</h3>
          <p className="text-3xl font-bold text-green-600">{kpis.energyDelta} kWh</p>
          <p className="text-sm text-gray-500">Total: {currentData.kwh_total} kWh</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Units Produced</h3>
          <p className="text-3xl font-bold text-purple-600">{currentData.count_total.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Δ 5min: +{kpis.countDelta}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Temperature</h3>
          <p className={`text-3xl font-bold ${currentData.temp_c > 60 ? 'text-red-600' : currentData.temp_c > 45 ? 'text-yellow-600' : 'text-green-600'}`}>
            {currentData.temp_c}°C
          </p>
          <p className="text-sm text-gray-500">Max 5min: {kpis.maxTemp}°C</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Power & Power Factor Trends</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p>Power: {currentData.kw} kW</p>
              <p>Power Factor: {currentData.pf}</p>
              <p className="text-sm mt-2">Chart visualization would show trends over time</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Temperature Monitoring</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p>Current: {currentData.temp_c}°C</p>
              <p>Status: {currentData.temp_c > 60 ? 'High' : currentData.temp_c > 45 ? 'Normal' : 'Low'}</p>
              <p className="text-sm mt-2">Temperature trend over time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Electrical Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Phase Voltages</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-red-600 font-medium">VR:</span>
              <span className="font-bold">{currentData.vr}V</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-600 font-medium">VY:</span>
              <span className="font-bold">{currentData.vy}V</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-medium">VB:</span>
              <span className="font-bold">{currentData.vb}V</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Phase Currents</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-red-600 font-medium">IR:</span>
              <span className="font-bold">{currentData.ir}A</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-600 font-medium">IY:</span>
              <span className="font-bold">{currentData.iy}A</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-medium">IB:</span>
              <span className="font-bold">{currentData.ib}A</span>
            </div>
          </div>
        </div>
      </div>

      {/* Events & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Events</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">{new Date(currentData.ts).toLocaleTimeString()}</span>
              <span className="text-sm font-medium">{currentData.state} - {currentData.status}</span>
            </div>
            {currentData.alarm_code && (
              <div className="flex justify-between items-center py-2 border-b text-red-600">
                <span className="text-sm">Alarm</span>
                <span className="text-sm font-medium">{currentData.alarm_code}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Key Insights</h3>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded">
              <strong>Thermal Behavior:</strong> Temperature ranges 39-43°C during normal operation. Monitor for sustained high power periods.
            </div>
            <div className="p-3 bg-yellow-50 rounded">
              <strong>Phase Balance:</strong> Current phases show good balance (±10%). Monitor for significant deviations.
            </div>
            <div className="p-3 bg-green-50 rounded">
              <strong>Power Quality:</strong> Power factor maintains 0.89-0.98 range, indicating efficient operation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;