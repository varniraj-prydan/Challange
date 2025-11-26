import { useState, useRef, useEffect } from 'react';

const InteractiveChart = ({ data, title, color = "blue", unit = "", onClose, timestamps }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;
  const avgValue = data.reduce((sum, val) => sum + val, 0) / data.length;

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(10, prev * delta)));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{title} - Live Interactive View</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={resetView}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Reset View
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600">Current</div>
              <div className="text-lg font-bold" style={{ color }}>{data[data.length - 1]?.toFixed(2)} {unit}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600">Average</div>
              <div className="text-lg font-bold text-blue-600">{avgValue.toFixed(2)} {unit}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600">Maximum</div>
              <div className="text-lg font-bold text-red-600">{maxValue.toFixed(2)} {unit}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600">Minimum</div>
              <div className="text-lg font-bold text-green-600">{minValue.toFixed(2)} {unit}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600">Zoom</div>
              <div className="text-lg font-bold text-purple-600">{zoom.toFixed(1)}x</div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-2 mb-4">
            <div className="text-xs text-gray-600 mb-2">
              Controls: Mouse wheel to zoom • Click and drag to pan • Data points: {data.length}
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setZoom(z => Math.min(10, z * 1.5))} className="px-2 py-1 bg-gray-200 rounded text-xs">Zoom In</button>
              <button onClick={() => setZoom(z => Math.max(0.5, z / 1.5))} className="px-2 py-1 bg-gray-200 rounded text-xs">Zoom Out</button>
              <button onClick={resetView} className="px-2 py-1 bg-gray-200 rounded text-xs">Reset</button>
            </div>
          </div>

          <div 
            className="bg-white border rounded-lg overflow-hidden"
            style={{ height: '500px', cursor: isDragging ? 'grabbing' : 'grab' }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
          >
            <svg 
              ref={svgRef}
              className="w-full h-full" 
              viewBox={`${-pan.x / zoom} ${-pan.y / zoom} ${1000 / zoom} ${500 / zoom}`}
              style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
            >
              {/* Grid lines */}
              {Array.from({ length: 21 }, (_, i) => (
                <line
                  key={`h-${i}`}
                  x1="0"
                  y1={i * 25}
                  x2="1000"
                  y2={i * 25}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              ))}
              {Array.from({ length: 21 }, (_, i) => (
                <line
                  key={`v-${i}`}
                  x1={i * 50}
                  y1="0"
                  x2={i * 50}
                  y2="500"
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              ))}
              
              {/* Data area fill */}
              <path
                d={`M 0,500 ${data.map((value, index) => {
                  const x = (index / (data.length - 1)) * 1000;
                  const y = 500 - ((value - minValue) / range) * 500;
                  return `L ${x},${y}`;
                }).join(' ')} L 1000,500 Z`}
                fill={color}
                fillOpacity="0.1"
              />
              
              {/* Data line */}
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="3"
                points={data.map((value, index) => {
                  const x = (index / (data.length - 1)) * 1000;
                  const y = 500 - ((value - minValue) / range) * 500;
                  return `${x},${y}`;
                }).join(' ')}
              />
              
              {/* Data points */}
              {data.map((value, index) => {
                if (index % Math.max(1, Math.floor(data.length / 100)) !== 0) return null;
                const x = (index / (data.length - 1)) * 1000;
                const y = 500 - ((value - minValue) / range) * 500;
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill={color}
                      stroke="white"
                      strokeWidth="2"
                    />
                    <title>{`${timestamps?.[index] || index}: ${value.toFixed(2)} ${unit}`}</title>
                  </g>
                );
              })}
              
              {/* Y-axis labels */}
              {[0, 1, 2, 3, 4].map(i => {
                const value = minValue + (range * (4 - i) / 4);
                return (
                  <text
                    key={`y-label-${i}`}
                    x="10"
                    y={i * 125 + 15}
                    className="text-sm fill-gray-600"
                    style={{ fontSize: '12px' }}
                  >
                    {value.toFixed(1)} {unit}
                  </text>
                );
              })}
              
              {/* Current value indicator */}
              <line
                x1={((data.length - 1) / (data.length - 1)) * 1000}
                y1="0"
                x2={((data.length - 1) / (data.length - 1)) * 1000}
                y2="500"
                stroke="red"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              <text
                x={((data.length - 1) / (data.length - 1)) * 1000 - 30}
                y="20"
                className="text-sm fill-red-600 font-bold"
                style={{ fontSize: '12px' }}
              >
                NOW
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveChart;