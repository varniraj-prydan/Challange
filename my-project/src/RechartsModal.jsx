import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';

const RechartsModal = ({ data, title, color = "#3B82F6", unit = "", onClose, timestamps }) => {
  if (!data || data.length === 0) return null;

  // Sample data for better performance - take every nth point
  const sampleRate = Math.max(1, Math.floor(data.length / 500)); // Max 500 points
  const sampledData = data.filter((_, index) => index % sampleRate === 0);
  const sampledTimestamps = timestamps?.filter((_, index) => index % sampleRate === 0);

  const chartData = sampledData.map((value, index) => ({
    index: index * sampleRate,
    value,
    time: sampledTimestamps?.[index] || `${index * sampleRate}s`,
    timestamp: sampledTimestamps?.[index] || index * sampleRate
  }));

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const avgValue = data.reduce((sum, val) => sum + val, 0) / data.length;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="text-sm font-medium">{`Time: ${chartData[label]?.time}`}</p>
          <p className="text-sm" style={{ color }}>
            {`${title}: ${payload[0].value.toFixed(2)} ${unit}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{title} - Interactive Chart</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Current Value</div>
              <div className="text-2xl font-bold" style={{ color }}>{data[data.length - 1]?.toFixed(2)} {unit}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Average</div>
              <div className="text-2xl font-bold text-blue-600">{avgValue.toFixed(2)} {unit}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Maximum</div>
              <div className="text-2xl font-bold text-red-600">{maxValue.toFixed(2)} {unit}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Minimum</div>
              <div className="text-2xl font-bold text-green-600">{minValue.toFixed(2)} {unit}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600 mb-2">
              Interactive Controls: Use brush below to zoom/navigate • Hover for details • Sampled data: {chartData.length} of {data.length} points
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4" style={{ height: '600px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="index"
                  type="number"
                  scale="linear"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => {
                    const dataPoint = chartData.find(d => d.index === value);
                    return dataPoint?.time || value;
                  }}
                />
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickFormatter={(value) => `${value.toFixed(1)} ${unit}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color} 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 2 }}
                  isAnimationActive={false}
                />
                <Brush 
                  dataKey="index" 
                  height={60} 
                  stroke={color}
                  fill={color}
                  fillOpacity={0.1}
                  tickFormatter={(value) => {
                    const dataPoint = chartData.find(d => d.index === value);
                    return dataPoint?.time || value;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RechartsModal;