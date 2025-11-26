const DetailedChart = ({ data, title, color = "blue", unit = "", onClose }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;
  const avgValue = data.reduce((sum, val) => sum + val, 0) / data.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{title} - Detailed View</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Current</div>
              <div className="text-xl font-bold" style={{ color }}>{data[data.length - 1]?.toFixed(2)} {unit}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Average</div>
              <div className="text-xl font-bold text-blue-600">{avgValue.toFixed(2)} {unit}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Maximum</div>
              <div className="text-xl font-bold text-red-600">{maxValue.toFixed(2)} {unit}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Minimum</div>
              <div className="text-xl font-bold text-green-600">{minValue.toFixed(2)} {unit}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <svg className="w-full" viewBox="0 0 800 400" style={{ height: '400px' }}>
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map(i => (
                <line
                  key={`h-${i}`}
                  x1="0"
                  y1={i * 100}
                  x2="800"
                  y2={i * 100}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <line
                  key={`v-${i}`}
                  x1={i * 100}
                  y1="0"
                  x2={i * 100}
                  y2="400"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}
              
              {/* Data line */}
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="3"
                points={data.map((value, index) => {
                  const x = (index / (data.length - 1)) * 800;
                  const y = 400 - ((value - minValue) / range) * 400;
                  return `${x},${y}`;
                }).join(' ')}
              />
              
              {/* Data points */}
              {data.map((value, index) => {
                const x = (index / (data.length - 1)) * 800;
                const y = 400 - ((value - minValue) / range) * 400;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="3"
                    fill={color}
                    className="hover:r-5"
                  />
                );
              })}
              
              {/* Y-axis labels */}
              {[0, 1, 2, 3, 4].map(i => {
                const value = minValue + (range * (4 - i) / 4);
                return (
                  <text
                    key={`y-label-${i}`}
                    x="-5"
                    y={i * 100 + 5}
                    textAnchor="end"
                    className="text-xs fill-gray-600"
                  >
                    {value.toFixed(1)}
                  </text>
                );
              })}
            </svg>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Data points: {data.length} | Range: {range.toFixed(2)} {unit}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedChart;