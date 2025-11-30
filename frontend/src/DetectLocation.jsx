import React, { useEffect, useState } from "react";

function RKDailLocation() {
  const [add, setAdd] = useState({});
  const [coords, setCoords] = useState({});

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Save for showing on screen
        setCoords({ latitude, longitude });

        // Reverse Geocoding
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

        const res = await fetch(url);
        const data = await res.json();

        console.log("Reverse Location:", data);

        // Store Address Only
        setAdd(data.address);
      },
      (err) => {
        console.log("Location error:", err);
      },
      {
        enableHighAccuracy: false,  //
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }, []);

  return (
    <div style={{ fontSize: "18px" }}>
      <h3>Current Network Location</h3>

      <p><b>Latitude:</b> {coords.latitude}</p>
      <p><b>Longitude:</b> {coords.longitude}</p>
      <br />

      <p><b>Road:</b> {add.road}</p>
      <p><b>Area:</b> {add.suburb}</p>
      <p><b>City:</b> {add.city || add.town || add.village}</p>
      <p><b>District:</b> {add.county}</p>
      <p><b>State:</b> {add.state}</p>
      <p><b>Pincode:</b> {add.postcode}</p>
      <p><b>Country:</b> {add.country}</p>
    </div>
  );
}

export default RKDailLocation;
