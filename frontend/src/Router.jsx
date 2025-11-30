import { Routes, Route } from "react-router-dom";
import Auth from "./login.jsx";
import Dashboard from "./Dashboard.jsx";
import Val from "./show_category_cities_with_location.jsx";
import ShopDetails from "./shop_detail.jsx";
import Plan from "./plans.jsx";   

function RouterPage() {
  return (
    <Routes>

      {/* HOME PAGE → Val */}
      <Route path="/" element={<Val />} />


      <Route path="/login" element={<Auth />} />


      <Route path="/dashboard" element={<Dashboard />} />


      <Route path="/shop" element={<ShopDetails />} />

      <Route path="/plan" element={<Plan />} />   
    </Routes>
  );
}

export default RouterPage;
