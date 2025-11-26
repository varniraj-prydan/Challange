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
  const [lastDataTime, setLastDataTime] = useState(Date.now());
  const [showGapAlert, setShowGapAlert] = useState(false);

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
      setLastDataTime(Date.now());
    }
  }, [currentIndex, allData]);

  useEffect(() => {
    const gapInterval = setInterval(() => {
      const timeSinceLastData = Date.now() - lastDataTime;
      setShowGapAlert(timeSinceLastData > 10000); // 10 seconds
    }, 1000);
    return () => clearInterval(gapInterval);
  }, [lastDataTime]);

  const exportCSV = () => {
    if (!displayData.length) return;
    
    const headers = ['timestamp', 'machine_id', 'state', 'mode', 'status', 'vr', 'vy', 'vb', 'ir', 'iy', 'ib', 'kw', 'kwh_total', 'pf', 'count_total', 'temp_c', 'alarm_code'];
    const csvContent = [
      headers.join(','),
      ...displayData.map(row => headers.map(header => row[header === 'timestamp' ? 'ts' : header] || '').join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `machine_data_${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
    
    const windowMinutes = displayData.length / 60; // 1Hz data
    
    // Uptime percentages
    const runCount = displayData.filter(d => d.state === 'RUN').length;
    const idleCount = displayData.filter(d => d.state === 'IDLE').length;
    const offCount = displayData.filter(d => d.state === 'OFF').length;
    const uptimePercent = (runCount / displayData.length * 100).toFixed(1);
    const idlePercent = (idleCount / displayData.length * 100).toFixed(1);
    const offPercent = (offCount / displayData.length * 100).toFixed(1);
    
    // Average kW
    const avgPower = displayData.reduce((sum, d) => sum + d.kw, 0) / displayData.length;
    
    // Energy (kWh) - use energy register
    const energyDelta = displayData.length > 1 ? 
      Math.max(...displayData.map(d => d.kwh_total)) - Math.min(...displayData.map(d => d.kwh_total)) : 0;
    
    // PF average (RUN + IDLE only)
    const runIdleData = displayData.filter(d => d.state === 'RUN' || d.state === 'IDLE');
    const avgPF = runIdleData.length > 0 ? 
      runIdleData.reduce((sum, d) => sum + d.pf, 0) / runIdleData.length : 0;
    
    // Throughput (units/min)
    const countDelta = displayData.length > 1 ?
      displayData[displayData.length - 1].count_total - displayData[0].count_total : 0;
    const throughput = windowMinutes > 0 ? countDelta / windowMinutes : 0;
    
    // Phase imbalance %
    const currents = [currentData.ir, currentData.iy, currentData.ib];
    const maxCurrent = Math.max(...currents);
    const minCurrent = Math.min(...currents);
    const avgCurrent = currents.reduce((sum, i) => sum + i, 0) / 3;
    const phaseImbalance = avgCurrent > 0 ? ((maxCurrent - minCurrent) / avgCurrent * 100) : 0;
    
    return {
      uptimePercent,
      idlePercent, 
      offPercent,
      avgPower: avgPower.toFixed(2),
      energyDelta: energyDelta.toFixed(3),
      avgPF: avgPF.toFixed(3),
      throughput: throughput.toFixed(1),
      phaseImbalance: phaseImbalance.toFixed(1)
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
            {showGapAlert && (
              <span className="px-3 py-1 rounded-full bg-red-500 text-white text-sm animate-pulse">
                No data >10s
              </span>
            )}
            <button
              onClick={exportCSV}
              className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded"
            >
              Export CSV
            </button>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Uptime %</h3>
          <p className="text-2xl font-bold text-green-600">{kpis.uptimePercent}%</p>
          <p className="text-xs text-gray-500">RUN state</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Avg Power</h3>
          <p className="text-2xl font-bold text-blue-600">{kpis.avgPower} kW</p>
          <p className="text-xs text-gray-500">Window avg</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Energy</h3>
          <p className="text-2xl font-bold text-purple-600">{kpis.energyDelta} kWh</p>
          <p className="text-xs text-gray-500">Window delta</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Avg PF</h3>
          <p className="text-2xl font-bold text-orange-600">{kpis.avgPF}</p>
          <p className="text-xs text-gray-500">RUN+IDLE only</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Throughput</h3>
          <p className="text-2xl font-bold text-indigo-600">{kpis.throughput}</p>
          <p className="text-xs text-gray-500">units/min</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Phase Imbalance</h3>
          <p className={`text-2xl font-bold ${parseFloat(kpis.phaseImbalance) > 15 ? 'text-red-600' : 'text-green-600'}`}>{kpis.phaseImbalance}%</p>
          <p className="text-xs text-gray-500">Current phases</p>
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
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Auto-Insights</h3>
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-blue-50 rounded flex items-center justify-between">
              <span><strong>Peak 15-min Demand:</strong> {Math.max(...displayData.map(d => d.kw)).toFixed(2)} kW</span>
              <div className="relative">
                <div className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs cursor-help group">
                  i
                  <div className="absolute right-0 top-6 w-64 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    Maximum power demand in current window. Used for capacity planning and demand charge calculations.
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2 bg-yellow-50 rounded flex items-center justify-between">
              <span><strong>Phase Imbalance:</strong> {parseFloat(kpis.phaseImbalance) > 15 ? 'HIGH' : 'NORMAL'} ({kpis.phaseImbalance}%)</span>
              <div className="relative">
                <div className="w-4 h-4 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs cursor-help group">
                  i
                  <div className="absolute right-0 top-6 w-64 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    Current imbalance greater than 15% for more than 2min indicates electrical issues. Can cause overheating and reduced motor life.
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2 bg-green-50 rounded flex items-center justify-between">
              <span><strong>Power Quality:</strong> {parseFloat(kpis.avgPF) < 0.8 ? 'LOW PF DETECTED' : 'GOOD PF'}</span>
              <div className="relative">
                <div className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs cursor-help group">
                  i
                  <div className="absolute right-0 top-6 w-64 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    Power Factor less than 0.8 for more than 5min indicates poor power quality. Causes higher energy costs and potential penalties.
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