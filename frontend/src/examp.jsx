//import React, { useState } from "react";
//import { Button, InputGroup } from "@blueprintjs/core";
/*
function Val() {
  const [inputId, setInputId] = useState(""); // user input
  const [data, setData] = useState([]); // fetched data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // fetch data from API dynamically
  const fetchData = async () => {
    if (!inputId) {
      alert("Please enter category name!");
      return;
    }

    setLoading(true);
    setError("");
    setData([]);

    try {
      const url = `http://127.0.0.1:8000/category/static/?name=${inputId}`;
      console.log("Fetching:", url);

      const res = await fetch(url);
      const json = await res.json();

      if (json && Array.isArray(json.data)) {
        setData(json.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to fetch data. Check your backend or CORS settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Shop & City Details </h2>

      /Input box to enter category name
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <InputGroup
          placeholder="Enter category name (e.g., food)"
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          style={{ width: "250px" }}
        />
        <Button intent="primary" onClick={fetchData}>
          Fetch Data
        </Button>
      </div>


      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && data.length === 0 && <p>No data found</p>}

      {data.length > 0 && (
        <table
          border="1"
          cellPadding="8"
          style={{ borderCollapse: "collapse", width: "100%" }}
        >
          <thead>
            <tr>
              <th>Shop ID</th>
              <th>Shop Name</th>
              <th>Description</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Landmark</th>
              <th>City</th>
              <th>Pincode</th>
              <th>District</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const shop = item.shop || {};
              const city = item.city || {};
              return (
                <tr key={index}>
                  <td>{shop._id}</td>
                  <td>{shop.name}</td>
                  <td>{shop.description}</td>
                  <td>{shop.address}</td>
                  <td>{shop.phone_number}</td>
                  <td>{shop.email}</td>
                  <td>{shop.landmark}</td>
                  <td>{city.city_name}</td>
                  <td>{city.pincode}</td>
                  <td>{city.district}</td>
                  <td>{city.state}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Val;/*
