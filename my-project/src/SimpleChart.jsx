const SimpleChart = ({ data, title, color = "blue", onClick }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  return (
    <div className="w-full h-32">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-gray-600">{title}</h4>
        {onClick && (
          <button
            onClick={onClick}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            View Details
          </button>
        )}
      </div>
      <div 
        className={`relative h-24 bg-gray-50 rounded ${onClick ? 'cursor-pointer hover:bg-gray-100' : ''}`}
        onClick={onClick}
      >
        <svg className="w-full h-full" viewBox="0 0 300 80">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={data.map((value, index) => {
              const x = (index / (data.length - 1)) * 300;
              const y = 80 - ((value - minValue) / range) * 80;
              return `${x},${y}`;
            }).join(' ')}
          />
        </svg>
        <div className="absolute top-0 right-0 text-xs text-gray-500 p-1">
          {data[data.length - 1]?.toFixed(2)}
        </div>
        {onClick && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-10 rounded">
            <span className="text-xs text-gray-700 bg-white px-2 py-1 rounded shadow">Click for details</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleChart;