// ShopMarker.jsx
import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const shopIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/606/606807.png",
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function ShopMarker({ shop }) {
  return (
    <Marker
      position={[shop.latitude, shop.longitude]}
      icon={shopIcon}
    >
      <Popup>
        <strong>{shop.name}</strong>
        <br />
        {shop.address}
        <br />
        Rating: ⭐ {shop.rating}
      </Popup>
    </Marker>
  );
}

export default ShopMarker;
