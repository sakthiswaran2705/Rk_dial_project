import { Routes, Route } from "react-router-dom";

import Auth from "./login.jsx";
import Dashboard from "./Dashboard.jsx";
import Val from "./show_category_cities_with_location.jsx";
import ShopDetails from "./ex.jsx";
import Plan from "./plans.jsx";
import OfferDetails from "./OfferDetails.jsx";
import OffersList from "./offerlist.jsx";
import OfferForShop from "./offer_for_shop.jsx";
import Profile from "./profile.jsx";
import MyJobs from "./MyJobs";
import SearchResults from "./SearchResults.jsx";
import Jobs from "./Jobs";
import JobDetails from "./JobDetails";

// POLICY PAGES
import Contact from "./Contact";
import Shipping from "./Shipping";
import Privacy from "./Privacy";
import Terms from "./Terms";
import Refund from "./Refund";

function RouterPage() {
  return (
    <Routes>
      {/* HOME */}
      <Route path="/" element={<Val />} />

      {/* SEARCH */}
      <Route path="/results" element={<SearchResults />} />

      {/* AUTH */}
      <Route path="/login" element={<Auth />} />

      {/* DASHBOARD */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/my-jobs" element={<MyJobs />} />
      <Route path="/profile" element={<Profile />} />

      {/* SHOP */}
      <Route path="/shop" element={<ShopDetails />} />

      {/* PLANS */}
      <Route path="/plan" element={<Plan />} />

      {/* OFFERS */}
      <Route path="/offers" element={<OffersList />} />
      <Route path="/offers/shop/:shop_id" element={<OfferForShop />} />
      <Route path="/offer/details/:offer_id" element={<OfferDetails />} />

      {/* JOBS */}
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/job/:id" element={<JobDetails />} />

      {/* POLICY PAGES */}
      <Route path="/contact" element={<Contact />} />
      <Route path="/shipping" element={<Shipping />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/refund" element={<Refund />} />
    </Routes>
  );
}

export default RouterPage;
