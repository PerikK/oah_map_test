import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import AirQualityLayer from "./AirQualityLayer";

function MapView({ showPM25, showPM10, showO3 }) {
  return (
    <MapContainer
      center={[48, 10]} // Europe center
      zoom={7}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Only need one AirQualityLayer since it handles all parameters interactively */}
      {(showPM25 || showPM10 || showO3) && (
        <AirQualityLayer 
          parameter={
            showPM25 ? "pm2_5" : 
            showPM10 ? "pm10" : 
            showO3 ? "o3" : "aqi"
          } 
        />
      )}
    </MapContainer>
  );
}

export default MapView;