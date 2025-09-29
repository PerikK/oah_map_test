import { useState } from "react";
import MapView from "./components/MapView";

function App() {
  const [showPM25, setShowPM25] = useState(true);
  const [showPM10, setShowPM10] = useState(true);
  const [showO3, setShowO3] = useState(true);

  return (
    <div className="w-full h-screen flex flex-col">
      <header className="p-4 bg-green-700 text-white text-xl font-bold">
        🌍 European Air Pollution Map (OpenWeather)
      </header>

      <div className="p-4 bg-gray-100 border-b border-gray-300">
        <div className="flex gap-8 items-start">
          {/* PM2.5 */}
          <div className="flex flex-col">
            <label className="flex items-center gap-2 mb-2 font-medium">
              <input
                type="checkbox"
                checked={showPM25}
                onChange={(e) => setShowPM25(e.target.checked)}
                className="w-4 h-4"
              />
              PM2.5
            </label>
            <div className="ml-6 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: "#FEF9C3" }}></div>
                <span>0-12 μg/m³ (Good)</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: "#FDE047" }}></div>
                <span>12-35 μg/m³ (Moderate)</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: "#EAB308" }}></div>
                <span>35-55 μg/m³ (Unhealthy)</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: "#F59E0B" }}></div>
                <span>55-75 μg/m³ (Very Unhealthy)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: "#DC2626" }}></div>
                <span>75+ μg/m³ (Hazardous)</span>
              </div>
            </div>
          </div>

          {/* PM10 */}
          <div className="flex flex-col">
            <label className="flex items-center gap-2 mb-2 font-medium">
              <input
                type="checkbox"
                checked={showPM10}
                onChange={(e) => setShowPM10(e.target.checked)}
                className="w-4 h-4"
              />
              PM10
            </label>
            <div className="ml-6 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: "#FEF3C7" }}></div>
                <span>0-20 μg/m³ (Good)</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: "#D97706" }}></div>
                <span>20-50 μg/m³ (Moderate)</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: "#92400E" }}></div>
                <span>50-100 μg/m³ (Unhealthy)</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: "#78350F" }}></div>
                <span>100-150 μg/m³ (Very Unhealthy)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: "#451A03" }}></div>
                <span>150+ μg/m³ (Hazardous)</span>
              </div>
            </div>
          </div>

          {/* Ozone */}
          <div className="flex flex-col">
            <label className="flex items-center gap-2 mb-2 font-medium">
              <input
                type="checkbox"
                checked={showO3}
                onChange={(e) => setShowO3(e.target.checked)}
                className="w-4 h-4"
              />
              Ozone (O₃)
            </label>
            <div className="ml-6 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: "#E0F2FE" }}></div>
                <span>0-50 μg/m³ (Good)</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: "#7DD3FC" }}></div>
                <span>50-100 μg/m³ (Moderate)</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: "#3B82F6" }}></div>
                <span>100-150 μg/m³ (Unhealthy)</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: "#1E40AF" }}></div>
                <span>150-200 μg/m³ (Very Unhealthy)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: "#1E3A8A" }}></div>
                <span>200+ μg/m³ (Hazardous)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 h-full">
        <MapView showPM25={showPM25} showPM10={showPM10} showO3={showO3} />
      </div>
    </div>
  );
}

export default App;
