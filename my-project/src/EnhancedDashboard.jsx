import { useState, useEffect } from 'react';
import SimpleChart from './SimpleChart';
import RechartsModal from './RechartsModal';

const EnhancedDashboard = () => {
  const [allData, setAllData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000);
  const [modalChart, setModalChart] = useState(null);

  useEffect(() => {
    loadJsonlData();
  }, []);

  useEffect(() => {
    let interval;
    if (isPlaying && currentIndex < allData.length - 1) {
      interval = setInterval(() => {
        setCurrentIndex(prev => {
          const newIndex = prev + 1;
          if (newIndex >= allData.length) {
            setIsPlaying(false);
            return prev;
          }
          return newIndex;
        });
      }, playSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, allData.length, playSpeed]);

  useEffect(() => {
    if (allData.length > 0) {
      const windowSize = Math.min(60, currentIndex + 1); // Show last 60 seconds
      const startIndex = Math.max(0, currentIndex - windowSize + 1);
      setDisplayData(allData.slice(startIndex, currentIndex + 1));
    }
  }, [currentIndex, allData]);

  const loadJsonlData = async () => {
    try {
      const response = await fetch('/device_stream_20min.jsonl');
      const text = await response.text();
      const lines = text.trim().split('\n');
      const parsedData = lines.map(line => JSON.parse(line));
      setAllData(parsedData);
      setCurrentIndex(0);
      setDisplayData([parsedData[0]]);
    } catch (error) {
      console.error('Error loading JSONL data:', error);
    }
  };

  const currentData = allData[currentIndex];
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'OK': return 'bg-green-500';
      case 'WARNING': return 'bg-yellow-500';
      case 'FAULT': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateKPIs = () => {
    if (!displayData.length) return {};
    
    const avgPower = displayData.reduce((sum, d) => sum + d.kw, 0) / displayData.length;
    const maxTemp = Math.max(...displayData.map(d => d.temp_c));
    const minTemp = Math.min(...displayData.map(d => d.temp_c));
    const energyDelta = displayData.length > 1 ? 
      displayData[displayData.length - 1].kwh_total - displayData[0].kwh_total : 0;
    const countDelta = displayData.length > 1 ?
      displayData[displayData.length - 1].count_total - displayData[0].count_total : 0;
    
    return {
      avgPower: avgPower.toFixed(2),
      maxTemp: maxTemp.toFixed(1),
      minTemp: minTemp.toFixed(1),
      energyDelta: energyDelta.toFixed(3),
      countDelta
    };
  };

  const kpis = calculateKPIs();

  if (!currentData) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const progress = ((currentIndex + 1) / allData.length) * 100;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header with Controls */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Machine Dashboard</h1>
            <p className="text-gray-600">Machine: {currentData.machine_id}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-white text-sm ${currentData.state === 'RUN' ? 'bg-green-500' : 'bg-red-500'}`}>
              {currentData.state}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-sm">
              {currentData.mode}
            </span>
            <span className={`px-3 py-1 rounded-full text-white text-sm ${getStatusColor(currentData.status)}`}>
              {currentData.status}
            </span>
          </div>
        </div>
        
        {/* Playback Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={() => setCurrentIndex(0)}
            className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white"
          >
            Reset
          </button>
          
          <select
            value={playSpeed}
            onChange={(e) => setPlaySpeed(Number(e.target.value))}
            className="px-3 py-2 border rounded"
          >
            <option value={100}>10x Speed</option>
            <option value={500}>2x Speed</option>
            <option value={1000}>1x Speed</option>
            <option value={2000}>0.5x Speed</option>
          </select>
          
          <div className="flex-1 mx-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          
          <span className="text-sm text-gray-600">
            {new Date(currentData.ts).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Live Power</h3>
          <p className="text-3xl font-bold text-blue-600">{currentData.kw} kW</p>
          <p className="text-sm text-gray-500">Avg: {kpis.avgPower} kW</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Energy Delta</h3>
          <p className="text-3xl font-bold text-green-600">{kpis.energyDelta} kWh</p>
          <p className="text-sm text-gray-500">Total: {currentData.kwh_total} kWh</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Units Produced</h3>
          <p className="text-3xl font-bold text-purple-600">{currentData.count_total.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Δ: +{kpis.countDelta}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Temperature</h3>
          <p className={`text-3xl font-bold ${currentData.temp_c > 60 ? 'text-red-600' : currentData.temp_c > 45 ? 'text-yellow-600' : 'text-green-600'}`}>
            {currentData.temp_c}°C
          </p>
          <p className="text-sm text-gray-500">Range: {kpis.minTemp}-{kpis.maxTemp}°C</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Power & Temperature Trends</h3>
          <div className="space-y-4">
            <SimpleChart 
              data={displayData.map(d => d.kw)} 
              title="Power (kW)" 
              color="#3B82F6"
              onClick={() => setModalChart({ 
                data: allData.slice(0, currentIndex + 1).map(d => d.kw), 
                title: 'Power', 
                color: '#3B82F6', 
                unit: 'kW',
                timestamps: allData.slice(0, currentIndex + 1).map(d => new Date(d.ts).toLocaleTimeString())
              })}
            />
            <SimpleChart 
              data={displayData.map(d => d.temp_c)} 
              title="Temperature (°C)" 
              color="#EF4444"
              onClick={() => setModalChart({ 
                data: allData.slice(0, currentIndex + 1).map(d => d.temp_c), 
                title: 'Temperature', 
                color: '#EF4444', 
                unit: '°C',
                timestamps: allData.slice(0, currentIndex + 1).map(d => new Date(d.ts).toLocaleTimeString())
              })}
            />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Power Factor & Energy</h3>
          <div className="space-y-4">
            <SimpleChart 
              data={displayData.map(d => d.pf)} 
              title="Power Factor" 
              color="#10B981"
              onClick={() => setModalChart({ 
                data: allData.slice(0, currentIndex + 1).map(d => d.pf), 
                title: 'Power Factor', 
                color: '#10B981', 
                unit: '',
                timestamps: allData.slice(0, currentIndex + 1).map(d => new Date(d.ts).toLocaleTimeString())
              })}
            />
            <SimpleChart 
              data={displayData.map(d => d.kwh_total)} 
              title="Cumulative Energy (kWh)" 
              color="#8B5CF6"
              onClick={() => setModalChart({ 
                data: allData.slice(0, currentIndex + 1).map(d => d.kwh_total), 
                title: 'Cumulative Energy', 
                color: '#8B5CF6', 
                unit: 'kWh',
                timestamps: allData.slice(0, currentIndex + 1).map(d => new Date(d.ts).toLocaleTimeString())
              })}
            />
          </div>
        </div>
      </div>

      {/* Electrical Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Key Insights</h3>
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-blue-50 rounded flex items-center justify-between">
              <span><strong>Thermal:</strong> Temp varies 39-43°C with power changes</span>
              <div className="relative">
                <div className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs cursor-help group">
                  i
                  <div className="absolute right-0 top-6 w-64 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    Temperature correlates with power consumption. Higher power loads generate more heat. Normal range indicates good cooling system performance.
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2 bg-yellow-50 rounded flex items-center justify-between">
              <span><strong>Balance:</strong> Phases well balanced (±5%)</span>
              <div className="relative">
                <div className="w-4 h-4 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs cursor-help group">
                  i
                  <div className="absolute right-0 top-6 w-64 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    Three-phase electrical balance. All phases (R,Y,B) carry similar current/voltage loads within 5%. Good balance prevents overheating and ensures efficient operation.
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2 bg-green-50 rounded flex items-center justify-between">
              <span><strong>Efficiency:</strong> PF: 0.89-0.98 (Good)</span>
              <div className="relative">
                <div className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs cursor-help group">
                  i
                  <div className="absolute right-0 top-6 w-64 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    Power Factor measures electrical efficiency. Values 0.89-0.98 indicate good power quality with minimal reactive power waste, reducing energy costs.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {modalChart && (
        <RechartsModal
          data={modalChart.data}
          title={modalChart.title}
          color={modalChart.color}
          unit={modalChart.unit}
          timestamps={modalChart.timestamps}
          onClose={() => setModalChart(null)}
        />
      )}
    </div>
  );
};

export default EnhancedDashboard;