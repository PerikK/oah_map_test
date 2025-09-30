import { Marker, Popup, useMapEvents, Circle } from "react-leaflet";
import L from "leaflet";
import { useState } from "react";

// Get API key from environment variable
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

// Helper function to calculate new lat/lon given distance and bearing
function calculateNewPosition(lat, lon, distanceKm, bearingDegrees) {
  const R = 6371; // Earth's radius in km
  const bearing = (bearingDegrees * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lon * Math.PI) / 180;
  
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceKm / R) +
    Math.cos(lat1) * Math.sin(distanceKm / R) * Math.cos(bearing)
  );
  
  const lon2 = lon1 + Math.atan2(
    Math.sin(bearing) * Math.sin(distanceKm / R) * Math.cos(lat1),
    Math.cos(distanceKm / R) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  return {
    lat: (lat2 * 180) / Math.PI,
    lon: (lon2 * 180) / Math.PI
  };
}

// Generate points in a polar/circular pattern (concentric rings at specific angles)
function generatePolarGridPoints(centerLat, centerLon, radiusKm = 10) {
  const points = [];
  
  // Define concentric rings (distances from center)
  const rings = [
    radiusKm * 0.2,  // 20% of radius (inner ring)
    radiusKm * 0.4,  // 40% of radius
    radiusKm * 0.6,  // 60% of radius
    radiusKm * 0.8,  // 80% of radius
    radiusKm * 1.0   // 100% of radius (outer ring)
  ];
  
  // Define angles (directions) - 8 main directions + 8 intermediate = 16 total
  const numAngles = 16;
  const angleStep = 360 / numAngles;
  
  // Add center point
  points.push({
    lat: centerLat,
    lon: centerLon,
    id: `center`,
    distance: 0,
    angle: null
  });
  
  // Generate points in polar pattern
  rings.forEach((distance, ringIndex) => {
    for (let i = 0; i < numAngles; i++) {
      const angle = i * angleStep;
      const newPos = calculateNewPosition(centerLat, centerLon, distance, angle);
      points.push({
        lat: newPos.lat,
        lon: newPos.lon,
        id: `r${ringIndex}-a${angle}`,
        distance: distance,
        angle: angle
      });
    }
  });
  
  return points;
}

// Keep old function for backward compatibility but use new polar grid
function generateGridPoints(centerLat, centerLon, radiusKm = 10) {
  return generatePolarGridPoints(centerLat, centerLon, radiusKm);
}

// Removed makeIcon and getColorForParameter functions - no longer needed without individual markers

async function fetchAirQuality(lat, lon) {
  if (!lat || !lon) return null;
  
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
  );
  
  if (!res.ok) {
    throw new Error(`Failed to fetch air quality data (${res.status})`);
  }
  
  const data = await res.json();
  return {
    lat,
    lon,
    airData: data,
    timestamp: Date.now()
  };
}

// Fetch air quality data for multiple points in an area
async function fetchAreaAirQuality(centerLat, centerLon, radiusKm = 10) {
  const gridPoints = generateGridPoints(centerLat, centerLon, radiusKm);
  
  // Fetch data for all points in parallel, preserving metadata
  const promises = gridPoints.map(point => 
    fetchAirQuality(point.lat, point.lon)
      .then(result => {
        if (result) {
          // Preserve distance and angle metadata
          return {
            ...result,
            distance: point.distance,
            angle: point.angle,
            id: point.id
          };
        }
        return null;
      })
      .catch(err => {
        console.warn(`Failed to fetch data for ${point.lat}, ${point.lon}:`, err);
        return null;
      })
  );
  
  const results = await Promise.all(promises);
  
  // Filter out failed requests
  return results.filter(result => result !== null);
}

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
}

function AirQualityLayer({ parameter = "aqi" }) {
  const [areaDataPoints, setAreaDataPoints] = useState([]);
  const [isLoadingArea, setIsLoadingArea] = useState(false);
  const [centerPoint, setCenterPoint] = useState(null);
  const [averageValue, setAverageValue] = useState(null);

  const handleMapClick = async (lat, lon) => {
    setCenterPoint({ lat, lon });
    setIsLoadingArea(true);
    
    try {
      // Fetch air quality data for the area (10km radius)
      const areaData = await fetchAreaAirQuality(lat, lon, 20);
      setAreaDataPoints(areaData);
      
      // Calculate average value for the parameter
      if (areaData.length > 0) {
        const values = areaData.map(point => {
          if (parameter === "aqi") {
            return point.airData.list[0].main.aqi;
          }
          return point.airData.list[0].components[parameter] || 0;
        });
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        setAverageValue(avg);
      }
    } catch (error) {
      console.error("Failed to fetch area air quality data:", error);
    } finally {
      setIsLoadingArea(false);
    }
  };

  // Removed parameterConfig, getParameterValue, and getAQIDescription - no longer needed

  const clearAllMarkers = () => {
    setAreaDataPoints([]);
    setCenterPoint(null);
    setAverageValue(null);
  };

  // Get gradient color based on pollution level
  const getGradientColor = (value, parameter) => {
    if (parameter === "o3") {
      // Ozone: Light blue to dark blue (0-200 μg/m³)
      if (value < 50) return "#E0F2FE";      // Very light blue
      if (value < 100) return "#7DD3FC";     // Light blue
      if (value < 150) return "#3B82F6";     // Medium blue
      if (value < 200) return "#1E40AF";     // Dark blue
      return "#1E3A8A";                       // Very dark blue
    } else if (parameter === "pm10") {
      // PM10: Light brown to dark brown (0-150 μg/m³)
      if (value < 20) return "#FEF3C7";      // Very light brown/cream
      if (value < 50) return "#D97706";      // Light brown
      if (value < 100) return "#92400E";     // Medium brown
      if (value < 150) return "#78350F";     // Dark brown
      return "#451A03";                       // Very dark brown
    } else if (parameter === "pm2_5") {
      // PM2.5: Light yellow to dark orange (0-100 μg/m³)
      if (value < 12) return "#FEF9C3";      // Very light yellow
      if (value < 35) return "#FDE047";      // Light yellow
      if (value < 55) return "#EAB308";      // Medium yellow
      if (value < 75) return "#F59E0B";      // Orange
      return "#DC2626";                       // Red (very high)
    }
    return "#666";
  };

  // Get circle color and opacity based on parameter and average value
  const getCircleStyle = () => {
    if (!averageValue) return { color: "#666", fillOpacity: 0.5 };

    // For AQI, use traditional colors
    if (parameter === "aqi") {
      const aqiColors = {
        1: "#00E400", // Good - Green
        2: "#FFFF00", // Fair - Yellow
        3: "#FF7E00", // Moderate - Orange
        4: "#FF0000", // Poor - Red
        5: "#8F3F97", // Very Poor - Purple
      };
      const avgAqi = Math.round(averageValue);
      return { color: aqiColors[avgAqi] || "#666", fillOpacity: 0.5 };
    }

    // For specific parameters, use gradient colors
    const color = getGradientColor(averageValue, parameter);
    
    return { color, fillOpacity: 0.6 };
  };

  return (
    <>
      <MapClickHandler onMapClick={handleMapClick} />
      
      {/* Instructions popup */}
      <Marker position={[51.1657, 10.4515]} icon={L.divIcon({
        html: `<div style="background: #007bff; color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; white-space: nowrap;">
                Click to check air quality in a 100km radius
              </div>`,
        className: "",
        iconSize: [250, 40],
      })}>
        <Popup>
          <strong>How to use:</strong>
          <br />
          Click anywhere on the map to check air quality in a 10km radius around that point
          <br />
          <button 
            onClick={clearAllMarkers}
            style={{ marginTop: '8px', padding: '4px 8px', fontSize: '12px' }}
          >
            Clear All Markers
          </button>
        </Popup>
      </Marker>

      {/* Show center point marker */}
      {centerPoint && averageValue !== null && (
        <Marker
          position={[centerPoint.lat, centerPoint.lon]}
          icon={L.divIcon({
            html: `<div style="background: #007bff; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
            className: "",
            iconSize: [16, 16],
          })}
        >
          <Popup>
            <strong>Air Quality - 10km Radius</strong>
            <br />
            Lat: {centerPoint.lat.toFixed(4)}, Lon: {centerPoint.lon.toFixed(4)}
            <br />
            <br />
            {parameter === "aqi" ? (
              <>
                <strong>Average AQI: {averageValue.toFixed(1)}</strong>
                <br />
                <small>
                  {Math.round(averageValue) === 1 && "Good"}
                  {Math.round(averageValue) === 2 && "Fair"}
                  {Math.round(averageValue) === 3 && "Moderate"}
                  {Math.round(averageValue) === 4 && "Poor"}
                  {Math.round(averageValue) === 5 && "Very Poor"}
                </small>
              </>
            ) : (
              <>
                <strong>Average {parameter.toUpperCase()}: {averageValue.toFixed(2)} μg/m³</strong>
              </>
            )}
            <br />
            <small>Based on {areaDataPoints.length} sample points</small>
            <br />
            <button 
              onClick={clearAllMarkers}
              style={{ marginTop: '8px', padding: '4px 8px', fontSize: '12px' }}
            >
              Clear Area
            </button>
          </Popup>
        </Marker>
      )}

      {/* Show circular area overlay - main boundary circle */}
      {centerPoint && averageValue !== null && (
        <Circle
          center={[centerPoint.lat, centerPoint.lon]}
          radius={20000} // 100km in meters
          pathOptions={{
            color: getCircleStyle().color,
            fillColor: "transparent", // Make main circle transparent
            fillOpacity: 0,
            weight: 2,
          }}
        />
      )}

      {/* Show individual data point circles with color variations in polar pattern */}
      {areaDataPoints.map((dataPoint) => {
        const aqi = dataPoint.airData?.list[0]?.main?.aqi;
        const value = parameter === "aqi" 
          ? aqi 
          : dataPoint.airData?.list[0]?.components[parameter];
        
        // Get color for this specific data point
        const pointColor = parameter === "aqi" 
          ? (() => {
              const aqiColors = {
                1: "#00E400", 2: "#FFFF00", 3: "#FF7E00", 
                4: "#FF0000", 5: "#8F3F97"
              };
              return aqiColors[aqi] || "#666";
            })()
          : getGradientColor(value, parameter);

        // Get direction label
        const getDirectionLabel = (angle) => {
          if (angle === null) return "Center";
          const directions = [
            "North", "NNE", "NE", "ENE",
            "East", "ESE", "SE", "SSE",
            "South", "SSW", "SW", "WSW",
            "West", "WNW", "NW", "NNW"
          ];
          const index = Math.round(angle / 22.5) % 16;
          return directions[index];
        };

        // Adjust circle size based on distance from center (smaller for inner rings)
        const circleRadius = dataPoint.distance === 0 ? 2000 : Math.max(3000, dataPoint.distance * 1000 * 0.3);

        return (
          <Circle
            key={dataPoint.id}
            center={[dataPoint.lat, dataPoint.lon]}
            radius={circleRadius}
            pathOptions={{
              color: pointColor,
              fillColor: pointColor,
              fillOpacity: 0.5,
              weight: 1,
              opacity: 0.7,
            }}
          >
            <Popup>
              <strong>Air Quality Data Point</strong>
              <br />
              <strong>Direction:</strong> {getDirectionLabel(dataPoint.angle)}
              <br />
              <strong>Distance:</strong> {dataPoint.distance.toFixed(1)} km from center
              <br />
              <br />
              {parameter === "aqi" ? (
                <>
                  <strong>AQI: {aqi}</strong>
                  <br />
                  <small>
                    {aqi === 1 && "Good"}
                    {aqi === 2 && "Fair"}
                    {aqi === 3 && "Moderate"}
                    {aqi === 4 && "Poor"}
                    {aqi === 5 && "Very Poor"}
                  </small>
                </>
              ) : (
                <>
                  <strong>{parameter.toUpperCase()}: {value?.toFixed(2)} μg/m³</strong>
                </>
              )}
              <br />
              <small>Lat: {dataPoint.lat.toFixed(4)}, Lon: {dataPoint.lon.toFixed(4)}</small>
              <br />
              <small>Last update: {new Date(dataPoint.airData.list[0].dt * 1000).toLocaleString()}</small>
            </Popup>
          </Circle>
        );
      })}

      {/* Show loading state */}
      {isLoadingArea && centerPoint && (
        <Marker
          position={[centerPoint.lat, centerPoint.lon]}
          icon={L.divIcon({
            html: `<div style="background:#666; width:20px; height:20px; border-radius:50%; border:3px solid white; animation: pulse 1s infinite;"></div>
                   <style>
                     @keyframes pulse {
                       0% { opacity: 1; transform: scale(1); }
                       50% { opacity: 0.5; transform: scale(1.2); }
                       100% { opacity: 1; transform: scale(1); }
                     }
                   </style>`,
            className: "",
            iconSize: [20, 20],
          })}
        >
          <Popup>
            <strong>Loading area air quality data...</strong>
            <br />
            Fetching data for 10km radius
            <br />
            Please wait...
          </Popup>
        </Marker>
      )}
    </>
  );
}

export default AirQualityLayer;