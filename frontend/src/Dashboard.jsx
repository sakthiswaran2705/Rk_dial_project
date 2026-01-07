import React, { useEffect, useRef, useState } from "react";
import { authenticatedFetch } from "./authFetch";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

// CONSTANTS
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_BYTES = 20 * 1024 * 1024; // 20MB
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const mediaUrl = (path) => (path ? `${BACKEND_URL}/${path}` : "");

//TRANSLATION MAP
const TXT = {
  dashboard: { en: "Shop Dashboard", ta: "கடை கட்டுப்பாட்டுப் பலகை" },
  addShop: { en: "+ Add Shop", ta: "+ கடையைச் சேர்" },
  addOffer: { en: "+ Add Offer", ta: "+ சலுகையைச் சேர்" },
  myJobs: { en: "+ My Jobs", ta: "+ எனது வேலைகள்" },
  noShops: { en: 'No shops found. Click "Add Shop" to get started.', ta: "கடைகள் எதுவும் இல்லை. தொடங்க 'கடையைச் சேர்' என்பதைக் கிளிக் செய்யவும்." },
  address: { en: "Address:", ta: "முகவரி:" },
  phone: { en: "Phone:", ta: "தொலைபேசி:" },
  email: { en: "Email:", ta: "மின்னஞ்சல்:" },
  keywords: { en: "Keywords:", ta: "முக்கிய வார்த்தைகள்:" },
  editShop: { en: "Edit Shop", ta: "கடையைத் திருத்து" },
  deleteShop: { en: "Delete Shop", ta: "கடையை நீக்கு" },
  deleting: { en: "Deleting...", ta: "நீக்கப்படுகிறது..." },
  media: { en: "Media", ta: "ஊடகம்" },
  more: { en: "more", ta: "கூடுதல்" },
  offers: { en: "Offers", ta: "சலுகைகள்" },
  off: { en: "OFF", ta: "தள்ளுபடி" },
  edit: { en: "Edit", ta: "திருத்து" },
  delete: { en: "Delete", ta: "நீக்கு" },
  updateShopDetails: { en: "Update Shop Details", ta: "கடை விவரங்களைப் புதுப்பி" },
  addNewShop: { en: "Add New Shop", ta: "புதிய கடையைச் சேர்" },
  shopName: { en: "Shop Name", ta: "கடையின் பெயர்" },
  description: { en: "Description", ta: "விளக்கம்" },
  landmark: { en: "Landmark", ta: "அடையாளம்" },
  categoryList: { en: "Category list (comma separated)", ta: "வகைப்பட்டியல் (கமா மூலம் பிரிக்கவும்)" },
  cityName: { en: "City Name", ta: "நகரத்தின் பெயர்" },
  district: { en: "District", ta: "மாவட்டம்" },
  pincode: { en: "Pincode", ta: "அஞ்சல் குறியீடு" },
  state: { en: "State", ta: "மாநிலம்" },
  keywordsPlaceholder: { en: "Keywords (comma separated)", ta: "முக்கிய வார்த்தைகள் (கமா மூலம் பிரிக்கவும்)" },
  uploadPhotosLabel: { en: "Upload Shop Media", ta: "கடை ஊடகத்தைப் பதிவேற்றவும்" },
  uploadHintAdd: { en: "Images Only (Max 5MB)", ta: "படங்கள் மட்டும் (அதிகபட்சம் 5MB)" },
  uploadHintUpdate: { en: "Images (5MB) or Videos (20MB)", ta: "படங்கள் (5MB) அல்லது வீடியோக்கள் (20MB)" },
  saving: { en: "Saving...", ta: "சேமிக்கப்படுகிறது..." },
  save: { en: "Save", ta: "சேமி" },
  cancel: { en: "Cancel", ta: "ரத்து செய்" },
  addNewOffer: { en: "Add New Offer", ta: "புதிய சலுகையைச் சேர்" },
  selectShop: { en: "-- Select Shop --", ta: "-- கடையைத் தேர்ந்தெடுக்கவும் --" },
  offerTitle: { en: "Offer Title", ta: "சலுகை தலைப்பு" },
  feeOptional: { en: "Fee (optional)", ta: "கட்டணம் (விருப்பமானது)" },
  percentageLimit: { en: "Percentage (0-100)", ta: "சதவீதம் (0-100)" },
  uploadOffer: { en: "Upload Offer", ta: "சலுகையைப் பதிவேற்று" },
  uploading: { en: "Uploading...", ta: "பதிவேற்றப்படுகிறது..." },
  mediaFileLabel: { en: "Media File (Image max 5MB, Video max 20MB)", ta: "ஊடகக் கோப்பு (படம் அதிகபட்சம் 5MB, வீடியோ அதிகபட்சம் 20MB)" },
  updateOffer: { en: "Update Offer", ta: "சலுகையைப் புதுப்பி" },
  replaceMedia: { en: "Replace Media (optional)", ta: "ஊடகத்தை மாற்றவும் (விருப்பமானது)" },
  confirmDeleteShop: { en: "Delete this shop?", ta: "இந்த கடையை நீக்கவா?" },
  confirmDeletePhoto: { en: "Delete this photo?", ta: "இந்த புகைப்படத்தை நீக்கவா?" },
  confirmDeleteOffer: { en: "Delete this offer?", ta: "இந்த சலுகையை நீக்கவா?" },
  enterTitle: { en: "Enter title", ta: "தலைப்பை உள்ளிடவும்" },
  selectShopErr: { en: "Select shop", ta: "கடையைத் தேர்ந்தெடுக்கவும்" },
  citySelectErr: { en: "Please select a city from the dropdown list.", ta: "பட்டியலிலிருந்து ஒரு நகரத்தைத் தேர்ந்தெடுக்கவும்." },
  back: { en: "Back", ta: "பின்செல்ல" },
  close: { en: "Close", ta: "மூடு" }
};

export default function Dashboard() {
  const navigate = useNavigate();

  // --- STATE ---
  const [shops, setShops] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [lang, setLang] = useState(localStorage.getItem("LANG") || "en");

  // Subscription Plan State
  const [planInfo, setPlanInfo] = useState(null);

  // Deletion States
  const [deletingId, setDeletingId] = useState(null);

  // Suggestions
  const [categorySug, setCategorySug] = useState([]);
  const [citySug, setCitySug] = useState([]);
  const typingRef = useRef(null);

  // --- FORMS STATE ---
  // Shop Form
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null); // null = Add Mode, ID = Edit Mode
  const [saving, setSaving] = useState(false);
  const [citySelected, setCitySelected] = useState(false);
  const fileInputRef = useRef(null); // Ref for resetting file input
  const mainImageInputRef = useRef(null); // Ref for main image input

  const [form, setForm] = useState({
    shop_name: "", description: "", address: "", phone_number: "", email: "", landmark: "",
    category_list: "", city_id: "", city_name: "", district: "", pincode: "", state: "",
    keywords: "", shop_media: []
  });

  // Media State
  const [previewImg, setPreviewImg] = useState([]); // Array of { type, url } for NEW gallery uploads
  const [existingPhotos, setExistingPhotos] = useState([]); // Array from backend for EDIT mode

  // Main Image State
  const [mainImageFile, setMainImageFile] = useState(null); // The actual file object
  const [mainImagePreview, setMainImagePreview] = useState(null); // URL for preview
  const [existingMainImage, setExistingMainImage] = useState(null); // String URL from backend

  // Offer Form (Add)
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerUploading, setOfferUploading] = useState(false);
  const [offerPreview, setOfferPreview] = useState(null);
  const [offerForm, setOfferForm] = useState({
    shop_id: "", title: "", fee: "", start_date: "", end_date: "",
    percentage: "", description: "", file: null
  });

  // Offer Form (Update)
  const [showUpdateOfferForm, setShowUpdateOfferForm] = useState(false);
  const [updateOfferSaving, setUpdateOfferSaving] = useState(false);
  const [updateOfferPreview, setUpdateOfferPreview] = useState(null);
  const [updateOfferForm, setUpdateOfferForm] = useState({
    offer_id: "", shop_id: "", title: "", fee: "", start_date: "", end_date: "",
    percentage: "", description: "", file: null
  });

  // --- GALLERY STATE ---
  const [gallery, setGallery] = useState({
    isOpen: false,
    mediaList: [],
    currentIndex: 0,
    shopName: ""
  });

  // --- EFFECTS ---

  useEffect(() => {
    const handleLangUpdate = () => setLang(localStorage.getItem("LANG") || "en");
    window.addEventListener("languageChange", handleLangUpdate);
    return () => window.removeEventListener("languageChange", handleLangUpdate);
  }, []);

  useEffect(() => {
    loadShops();
    fetchPlanStatus(); // Check plan on load
  }, [lang]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      previewImg.forEach(p => URL.revokeObjectURL(p.url));
      if (offerPreview) URL.revokeObjectURL(offerPreview);
      if (updateOfferPreview) URL.revokeObjectURL(updateOfferPreview);
      if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    };
  }, [previewImg, offerPreview, updateOfferPreview, mainImagePreview]);

  // --- API ---

  async function loadShops() {
    try {
      const res = await authenticatedFetch(`/myshop/?lang=${lang}`, {
        method: "GET",
        headers: { Accept: "application/json" }
      });
      const json = await res.json();
      if (json?.data) setShops(json.data);
      else showError(json?.message || "Failed to load shops");
    } catch (err) {
      console.warn("Load error:", err);
    }
  }

  // --- PLAN API & HELPER ---
  async function fetchPlanStatus() {
    try {
      const res = await authenticatedFetch("/my-plan/", { method: "GET" });
      const json = await res.json();
      if (json?.status) setPlanInfo(json);
    } catch (e) { console.warn("Plan check failed", e); }
  }

  // --- UPDATED CHECKLIMIT FUNCTION ---
  const checkLimit = (type) => {
    // 1. If Plan info hasn't loaded yet, block nicely
    if (!planInfo) return false;

    // 2. Not Subscribed Check
    if (!planInfo.subscribed) {
      // Show confirmation dialog as requested
      if (window.confirm("You need an active subscription to continue. Do you want to view plans?")) {
        navigate("/plan");
      }
      // Return false to stop the modal from opening
      return false;
    }

    // 3. Subscription Active: Check Shop Limit
    if (type === "shop") {
      if (planInfo.usage.shops_left <= 0) {
        alert(`You have reached the shop limit for the ${planInfo.plan} plan.`);
        return false;
      }
    }

    // 4. Subscription Active: Check Offer Limit
    if (type === "offer") {
      if (planInfo.usage.offers_left <= 0) {
        alert(`You have reached the offer limit for the ${planInfo.plan} plan.`);
        return false;
      }
    }

    // If all checks pass, allow access
    return true;
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  const fetchCategory = async (text) => {
    if (!text?.trim()) return setCategorySug([]);
    try {
      const res = await fetch(`${BACKEND_URL}/category/search/?category=${encodeURIComponent(text)}&lang=${lang}`);
      const json = await res.json();
      if (json?.status === "success") setCategorySug(json.data || []);
    } catch (e) {}
  };

  const fetchCity = async (text) => {
    if (!text?.trim()) return setCitySug([]);
    try {
      const res = await fetch(`${BACKEND_URL}/city/search?city_name=${encodeURIComponent(text)}&lang=${lang}`);
      const json = await res.json();
      if (json?.status === "success") setCitySug(json.data || []);
    } catch (e) {}
  };

  // --- HANDLERS ---

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const onCategoryTyping = (value) => {
    const last = value.split(",").pop().trim();
    handleInputChange("category_list", value);
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => fetchCategory(last), 300);
  };

  const onCityTyping = (value) => {
    handleInputChange("city_name", value);
    handleInputChange("city_id", "");
    setCitySelected(false);
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => fetchCity(value), 300);
  };

  // --- SHOP FORM HANDLERS ---

  const handleAddOpen = () => {
    // Check Limit handles Subscription check + Limit check
    if (!checkLimit("shop")) return;

    setEditingShop(null); // Flag for Add Mode
    setCitySelected(false);
    setForm({
      shop_name: "", description: "", address: "", phone_number: "", email: "", landmark: "",
      category_list: "", city_name: "", district: "", pincode: "", state: "", keywords: "", shop_media: []
    });
    setPreviewImg([]);
    setExistingPhotos([]);

    // Main Image Reset
    setMainImageFile(null);
    setMainImagePreview(null);
    setExistingMainImage(null);

    setShowForm(true);
  };

  const handleUpdateOpen = (item) => {
    setEditingShop(item.shop._id); // Flag for Edit Mode
    setCitySelected(true);
    setForm({
      shop_name: item.shop.shop_name || "",
      description: item.shop.description || "",
      address: item.shop.address || "",
      phone_number: item.shop.phone_number || "",
      email: item.shop.email || "",
      landmark: item.shop.landmark || "",
      category_list: item.categories ? item.categories.map(c => c.name).join(", ") : "",
      city_name: item.city?.city_name || "",
      district: item.city?.district || "",
      pincode: item.city?.pincode || "",
      state: item.city?.state || "",
      keywords: Array.isArray(item.shop.keywords) ? item.shop.keywords.join(", ") : item.shop.keywords || "",
      shop_media: [], // Reset new uploads
    });
    setPreviewImg([]);
    setExistingPhotos(item.shop.media || []);

    // Main Image Set
    setMainImageFile(null);
    setMainImagePreview(null);
    setExistingMainImage(item.shop.main_image || null);

    setShowForm(true);
  };

  // FILE HANDLING - MAIN IMAGE
  const handleMainImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Strict validation for Main Image (Images only, max 5MB)
    if (!file.type.startsWith("image/")) {
      alert("Main Image must be a valid image file.");
      if (mainImageInputRef.current) mainImageInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      alert(`Main Image too large: ${file.name} (Max 5MB)`);
      if (mainImageInputRef.current) mainImageInputRef.current.value = "";
      return;
    }

    setMainImageFile(file);
    if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    setMainImagePreview(URL.createObjectURL(file));
  };

  const removeMainImage = () => {
    setMainImageFile(null);
    if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    setMainImagePreview(null);
    if (mainImageInputRef.current) mainImageInputRef.current.value = "";
  };

  // FILE HANDLING - SHOP MEDIA (GALLERY)
  const handleShopFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Strict Backend Rule Check
    // Add Mode (!editingShop): IMAGES ONLY
    // Edit Mode (editingShop): IMAGES + VIDEOS
    const isAddMode = !editingShop;

    const newMedia = [];
    const newPreviews = [];

    for (const file of files) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (isAddMode && isVideo) {
        alert("Videos are only allowed when editing an existing shop.");
        continue;
      }

      if (isImage) {
        if (file.size > MAX_IMAGE_BYTES) {
          alert(`File too large: ${file.name} (Max 5MB)`);
          continue;
        }
        newMedia.push(file);
        newPreviews.push({ type: "image", url: URL.createObjectURL(file) });
      } else if (isVideo) {
        // This block only runs in edit mode due to the check above
        if (file.size > MAX_VIDEO_BYTES) {
          alert(`File too large: ${file.name} (Max 20MB)`);
          continue;
        }
        newMedia.push(file);
        newPreviews.push({ type: "video", url: URL.createObjectURL(file) });
      } else {
        alert(`Invalid type: ${file.name}`);
      }
    }

    setForm(prev => ({ ...prev, shop_media: [...prev.shop_media, ...newMedia] }));
    setPreviewImg(prev => [...prev, ...newPreviews]);

    // IMPORTANT: Reset input to allow re-selecting same file if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeNewPreview = (index) => {
    setForm(prev => {
      const m = [...prev.shop_media];
      m.splice(index, 1);
      return { ...prev, shop_media: m };
    });
    setPreviewImg(prev => {
      URL.revokeObjectURL(prev[index].url);
      const p = [...prev];
      p.splice(index, 1);
      return p;
    });
  };

  const submitShopForm = async () => {
    if (!form.city_id && !citySelected) return showError(TXT.citySelectErr[lang]);

    setSaving(true);
    const fd = new FormData();

    // 1. Append General Fields
    Object.keys(form).forEach(k => {
      if (k === "shop_media") {
        // Handled below specifically
      } else {
        fd.append(k, form[k] || "");
      }
    });

    // 2. Append Main Image (MUST use 'main_image' key)
    // Only append if a new file is selected.
    if (mainImageFile) {
      fd.append("main_image", mainImageFile);
    }

    // 3. Append Gallery Media (MUST use 'media' key)
    form.shop_media.forEach(f => fd.append("media", f));

    const url = editingShop
      ? `/shop/update/${editingShop}/?lang=${lang}`
      : `/shop/add/?lang=${lang}`;

    try {
      const res = await authenticatedFetch(url, { method: "POST", body: fd });
      const json = await res.json();
      if (json?.status === "success") {
        setShowForm(false);
        await loadShops();
        await fetchPlanStatus(); // Refresh limit counts
      } else {
        showError(json?.message || "Operation failed");
      }
    } catch (e) {
      showError("Server Error");
    } finally {
      setSaving(false);
    }
  };

  const deleteShop = async (id) => {
    if (!window.confirm(TXT.confirmDeleteShop[lang])) return;
    setDeletingId(id);
    try {
      const res = await authenticatedFetch(`/shop/delete/${id}/?lang=${lang}`, { method: "DELETE" });
      const json = await res.json();
      if (json?.status === "success") {
         await loadShops();
         await fetchPlanStatus(); // Refresh limit counts
      } else showError("Delete failed");
    } catch (e) { showError("Server Error"); }
    finally { setDeletingId(null); }
  };

  // --- FIXED DELETE LOGIC ---
  const deleteExistingPhoto = async (path) => {
    if (!window.confirm(TXT.confirmDeletePhoto[lang])) return;

    // Construct FormData to delete by path using update API
    const fd = new FormData();
    fd.append("delete_media", path);

    try {
      const res = await authenticatedFetch(`/shop/update/${editingShop}/?lang=${lang}`, { method: "POST", body: fd });
      const json = await res.json();
      if (json?.status === "success") {
        // Update local state to remove the item visually
        setExistingPhotos(prev => prev.filter(p => p.path !== path));
        loadShops(); // Refresh parent data
      } else {
        showError(json?.message || "Delete failed");
      }
    } catch (e) { showError("Server Error"); }
  };

  // --- OFFER HANDLERS ---

  const handleOfferFile = (file, isUpdate = false) => {
    if (!file) return;
    let valid = false;
    if (file.type.startsWith("image/") && file.size <= MAX_IMAGE_BYTES) valid = true;
    else if (file.type.startsWith("video/") && file.size <= MAX_VIDEO_BYTES) valid = true;

    if (!valid) return alert(TXT.mediaFileLabel[lang]);

    const url = URL.createObjectURL(file);
    if (isUpdate) {
      if (updateOfferPreview) URL.revokeObjectURL(updateOfferPreview);
      setUpdateOfferForm(p => ({ ...p, file }));
      setUpdateOfferPreview(url);
    } else {
      if (offerPreview) URL.revokeObjectURL(offerPreview);
      setOfferForm(p => ({ ...p, file }));
      setOfferPreview(url);
    }
  };

  const submitOffer = async (isUpdate) => {
    const f = isUpdate ? updateOfferForm : offerForm;
    if (!f.shop_id && !isUpdate) return alert(TXT.selectShopErr[lang]);
    if (!f.title || !f.start_date || !f.end_date) return alert(TXT.enterTitle[lang]);
    if (!isUpdate && !f.file) return alert("File required");

    const fd = new FormData();
    if (isUpdate) {
      fd.append("offer_id", f.offer_id);
      fd.append("shop_id", f.shop_id);
      if (f.file) fd.append("file", f.file); // Optional for update
    } else {
      fd.append("target_shop_id", f.shop_id);
      fd.append("file", f.file);
    }

    fd.append("title", f.title);
    fd.append("fee", f.fee);
    fd.append("start_date", f.start_date);
    fd.append("end_date", f.end_date);
    fd.append("percentage", f.percentage);
    fd.append("description", f.description);

    const setter = isUpdate ? setUpdateOfferSaving : setOfferUploading;
    const url = isUpdate ? `/offer/update/?lang=${lang}` : `/offer/add/?lang=${lang}`;

    setter(true);
    try {
      const res = await authenticatedFetch(url, { method: "POST", body: fd });
      const json = await res.json();
      if (json?.status) {
        if (isUpdate) setShowUpdateOfferForm(false);
        else setShowOfferForm(false);
        await loadShops();
        await fetchPlanStatus(); // Refresh limit counts
      } else alert(json?.message || "Failed");
    } catch (e) { alert("Server Error"); }
    finally { setter(false); }
  };

  const deleteOffer = async (id) => {
    if (!window.confirm(TXT.confirmDeleteOffer[lang])) return;
    try {
      const res = await authenticatedFetch(`/delete/offer/?offer_id=${id}&lang=${lang}`, { method: "DELETE" });
      const json = await res.json();
      if (json?.status === "success") {
          await loadShops();
          await fetchPlanStatus();
      }
    } catch (e) { alert("Server Error"); }
  };

  // --- GALLERY LOGIC ---
  const openGallery = (mediaSource, index = 0) => {
    let mediaList = [];
    let shopName = "";

    if (mediaSource.shop_name && Array.isArray(mediaSource.media)) {
        mediaList = mediaSource.media;
        shopName = mediaSource.shop_name;
    } else if (mediaSource.media && Array.isArray(mediaSource.media)) {
         mediaList = mediaSource.media;
         shopName = mediaSource.shop_name || "Offer Media";
    }

    setGallery({
      isOpen: true,
      mediaList: mediaList,
      currentIndex: index,
      shopName: shopName
    });
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    setGallery(p => ({ ...p, currentIndex: (p.currentIndex + 1) % p.mediaList.length }));
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setGallery(p => ({ ...p, currentIndex: (p.currentIndex - 1 + p.mediaList.length) % p.mediaList.length }));
  };

  // --- STYLES (Modern Design System) ---
  const colors = {
    primary: "#2563EB",
    primaryHover: "#1D4ED8",
    danger: "#DC2626",
    dangerHover: "#B91C1C",
    success: "#16A34A",
    bg: "#F3F4F6",
    card: "#FFFFFF",
    text: "#1F2937",
    subtext: "#6B7280",
    border: "#E5E7EB"
  };

  const s = {
    //page: { padding: "2rem", backgroundColor: colors.bg, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif,'Noto Sans Tamil'" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", background: colors.card, padding: "1rem 1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
    title: { margin: 0, fontSize: "1.5rem", fontWeight: "700", color: "#111827" },
    btnGroup: { display: "flex", gap: "12px" },
    btn: (color = colors.primary, disabled = false) => ({
      padding: "0.6rem 1.2rem", backgroundColor: disabled ? "#9CA3AF" : color, color: "white", border: "none", borderRadius: "8px",
      cursor: disabled ? "not-allowed" : "pointer", fontWeight: "500",fontFamily:"Noto Sans Tamil", fontSize: "0.9rem", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px", opacity: disabled ? 0.7 : 1
    }),
    card: { backgroundColor: colors.card, borderRadius: "16px", padding: "1.5rem", marginBottom: "2rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", display: "flex", flexDirection: "row", gap: "2rem", flexWrap: "wrap" },
    shopInfo: { flex: "1 1 400px", borderRight: "1px solid " + colors.border, paddingRight: "2rem" },
    shopMedia: { flex: "1 1 300px", minWidth: "300px" },
    detailRow: { margin: "0.5rem 0", color: colors.text, fontSize: "0.95rem", lineHeight: "1.5" },
    label: { fontWeight: "600", color: "#374151", marginRight: "6px" },
    tag: { backgroundColor: "#EEF2FF", color: colors.primary, padding: "2px 8px", borderRadius: "4px", fontSize: "0.85rem", marginRight: "4px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "10px", marginTop: "1rem" },
    thumb: { width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: "8px", cursor: "pointer", border: "1px solid " + colors.border, transition: "transform 0.2s" },
    moreBtn: { width: "100%", aspectRatio: "1/1", borderRadius: "8px", backgroundColor: "#F9FAFB", border: "1px dashed #9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", color: colors.subtext },
    overlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" },
    modal: { backgroundColor: "white", borderRadius: "16px", width: "100%", maxWidth: "650px", maxHeight: "90vh", overflowY: "auto", padding: "2rem", position: "relative", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" },
    input: { width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid " + colors.border, marginBottom: "1rem", fontSize: "0.95rem", boxSizing: "border-box" },
    closeBtn: { position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: colors.subtext },
    galleryOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "#000", zIndex: 10000, display: "flex", flexDirection: "column" },
    galleryMain: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
    galleryImg: { maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" },
    galleryNav: { position: "absolute", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.2)", color: "white", border: "none", padding: "1rem", cursor: "pointer", fontSize: "2rem", borderRadius: "50%", zIndex: 10 },
    galleryStrip: { height: "100px", display: "flex", gap: "10px", padding: "10px", overflowX: "auto", background: "#111", justifyContent: "center" },
    stripThumb: (active) => ({ height: "100%", width: "auto", opacity: active ? 1 : 0.5, cursor: "pointer", borderRadius: "4px", border: active ? "2px solid white" : "none" }),
    planBox: { background: "linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)", color: "white", padding: "0.8rem 1.2rem", borderRadius: "8px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "15px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", marginBottom: "1.5rem", flexWrap: "wrap"}
  };

  // Derived State for Button Logic
  const shopsLeft = planInfo?.usage?.shops_left ?? 0;
  const offersLeft = planInfo?.usage?.offers_left ?? 0;
  const isShopLimitReached = shopsLeft <= 0;
  const isOfferLimitReached = offersLeft <= 0;

  return (
    <div style={s.page}>
      <Navbar />

      {/* --- PLAN USAGE INFO BOX --- */}
      {planInfo && planInfo.subscribed && (
        <div style={s.planBox}>
          <span style={{fontWeight: "bold", textTransform: "capitalize", fontSize: "1rem"}}>
             👑 Plan: {planInfo.plan}
          </span>
          <div style={{height: "20px", width: "1px", background: "rgba(255,255,255,0.3)"}}></div>
          <span>Shops left: <strong>{shopsLeft}</strong></span>
          <div style={{height: "20px", width: "1px", background: "rgba(255,255,255,0.3)"}}></div>
          <span>Offers left: <strong>{offersLeft}</strong></span>
        </div>
      )}

      <div style={s.header}>
        <h2 style={s.title}>{TXT.dashboard[lang]}</h2>
        <div style={s.btnGroup}>

          {/* ADD SHOP BUTTON - UPDATED LOGIC */}
          <button
            style={s.btn(colors.success)}
            onClick={() => handleAddOpen()}
            // Removed disabled attribute
            title={isShopLimitReached ? "Plan limit reached" : ""}
          >
            {TXT.addShop[lang]}
          </button>

          {/* --- NAVIGATE TO MY JOBS PAGE --- */}
          <button style={s.btn(colors.primary)} onClick={() => navigate("/my-jobs")}>
             {TXT.myJobs ? TXT.myJobs[lang] : "+ My Jobs"}
          </button>

          {/* ADD OFFER BUTTON - UPDATED LOGIC */}
          <button
            style={s.btn(colors.primary)}
            onClick={() => {
              // Check limits/subscription first
              if (checkLimit("offer")) {
                setOfferForm({ shop_id: "", file: null });
                setShowOfferForm(true);
              }
            }}
            // Removed disabled attribute
            title={isOfferLimitReached ? "Plan limit reached" : ""}
          >
            {TXT.addOffer[lang]}
          </button>

          <button style={{...s.btn("white"), color: colors.text, border: "1px solid #ddd"}} onClick={() => navigate(-1)}>
            ← {TXT.back[lang]}
          </button>

        </div>
      </div>

      {errorMsg && <div style={{backgroundColor: "#FEE2E2", color: "#991B1B", padding: "1rem", borderRadius: "8px", marginBottom: "1rem"}}>{errorMsg}</div>}

      {shops.length === 0 ? (
        <div style={{textAlign: "center", color: colors.subtext, padding: "3rem"}}>{TXT.noShops[lang]}</div>
      ) : (
        shops.map((item, idx) => (
          <div key={idx} style={s.card}>
            {/* LEFT SIDE: DETAILS */}
            <div style={s.shopInfo}>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "start"}}>
                <h3 style={{marginTop: 0, color: colors.primary, fontSize: "1.25rem"}}>{item.shop.shop_name}</h3>
                <div style={{display: "flex", gap: "8px"}}>
                  <button onClick={() => handleUpdateOpen(item)} style={{...s.btn(colors.primary), padding: "4px 8px", fontSize: "0.8rem"}}>{TXT.edit[lang]}</button>
                  <button onClick={() => deleteShop(item.shop._id)} disabled={deletingId === item.shop._id} style={{...s.btn(colors.danger), padding: "4px 8px", fontSize: "0.8rem"}}>
                    {deletingId === item.shop._id ? "..." : TXT.delete[lang]}
                  </button>
                </div>
              </div>
              <p style={{color: colors.subtext, fontStyle: "italic", marginBottom: "1.5rem"}}>{item.shop.description}</p>

              <div style={s.detailRow}><span style={s.label}>{TXT.address[lang]}</span>{item.shop.address}</div>
              <div style={s.detailRow}><span style={s.label}>{TXT.phone[lang]}</span>{item.shop.phone_number}</div>
              <div style={s.detailRow}><span style={s.label}>{TXT.email[lang]}</span>{item.shop.email}</div>
              <div style={s.detailRow}>
                <span style={s.label}>{TXT.keywords[lang]}</span>
                <div style={{display: "inline-flex", flexWrap: "wrap", gap: "4px", marginTop: "4px"}}>
                {Array.isArray(item.shop.keywords)
                  ? item.shop.keywords.map((k, i) => k ? <span key={i} style={s.tag}>{k}</span> : null)
                  : (item.shop.keywords ? <span style={s.tag}>{item.shop.keywords}</span> : "")}
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: MEDIA & OFFERS */}
            <div style={s.shopMedia}>

              {/* MAIN IMAGE DISPLAY */}
              {item.shop.main_image && (
                 <div style={{marginBottom: "1rem"}}>
                     <img src={mediaUrl(item.shop.main_image)} style={{width: "100%", height: "200px", objectFit: "cover", borderRadius: "12px", border: "1px solid " + colors.border}} alt="Main" />
                 </div>
              )}

              {/* MEDIA GALLERY PREVIEW */}
              {item.shop.media?.length > 0 && (
                <div style={{marginBottom: "1.5rem"}}>
                  <h4 style={{margin: "0 0 0.5rem 0", fontSize: "0.9rem", textTransform: "uppercase", color: colors.subtext}}>{TXT.media[lang]}</h4>
                  <div style={s.grid}>
                    {item.shop.media.slice(0, 3).map((m, i) => (
                      <div key={i} onClick={() => openGallery(item.shop, i)} style={{position: "relative", cursor: "pointer"}}>
                        {m.type === "video" ? (
                           <video src={mediaUrl(m.path)} style={s.thumb} muted onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                        ) : (
                           <img src={mediaUrl(m.path)} style={s.thumb} alt="Shop" />
                        )}
                        {m.type === "video" && <div style={{position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "white", fontSize: "10px", padding: "2px 4px", borderRadius: "4px", pointerEvents: "none"}}>VID</div>}
                      </div>
                    ))}

                    {/* + MORE BUTTON */}
                    {item.shop.media.length > 3 && (
                      <div style={s.moreBtn} onClick={() => openGallery(item.shop, 3)}>
                        +{item.shop.media.length - 3} {TXT.more[lang]}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* OFFERS LIST */}
              {item.offers?.length > 0 && (
                <div>
                  <h4 style={{margin: "0 0 0.5rem 0", fontSize: "0.9rem", textTransform: "uppercase", color: colors.subtext}}>{TXT.offers[lang]}</h4>
                  <div style={{display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "10px", scrollbarWidth: "thin"}}>
                    {item.offers.map((off, i) => (
                      <div key={i} style={{minWidth: "130px", maxWidth: "130px", border: "1px solid #eee", borderRadius: "8px", padding: "8px", background: "#f9f9f9", flexShrink: 0}}>
                        <div onClick={() => openGallery({ shop_name: off.title, media: [{type: off.media_type, path: off.media_path}] }, 0)} style={{cursor: "pointer", height: "80px", borderRadius: "4px", overflow: "hidden", position: "relative"}}>
                          {off.media_type === "video" ? (
                             <video src={mediaUrl(off.media_path)} style={{width: "100%", height: "100%", objectFit: "cover"}} muted onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()}/>
                          ) : (
                             <img src={mediaUrl(off.media_path)} style={{width: "100%", height: "100%", objectFit: "cover"}} alt="Offer" />
                          )}
                          {off.media_type === "video" && <div style={{position: "absolute", bottom: 2, right: 2, background: "rgba(0,0,0,0.6)", color: "white", fontSize: "9px", padding: "1px 3px", borderRadius: "2px"}}>VID</div>}
                        </div>
                        <div style={{fontSize: "0.85rem", fontWeight: "bold", marginTop: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}} title={off.title}>{off.title}</div>
                        <div style={{fontSize: "0.75rem", color: colors.subtext}}>{off.percentage}% Off</div>
                        <div style={{display: "flex", gap: "4px", marginTop: "8px"}}>
                          <button style={{...s.btn(colors.primary), padding: "2px 6px", fontSize: "10px", flex: 1, justifyContent: "center"}} onClick={() => {
                             setUpdateOfferForm({
                               offer_id: off.offer_id, shop_id: item.shop._id,
                               title: off.title, fee: off.fee, start_date: off.start_date,
                               end_date: off.end_date, percentage: off.percentage, description: off.description, file: null
                             });
                             setUpdateOfferPreview(mediaUrl(off.media_path));
                             setShowUpdateOfferForm(true);
                           }}>{TXT.edit[lang]}</button>
                          <button style={{...s.btn(colors.danger), padding: "2px 8px", fontSize: "12px"}} onClick={() => deleteOffer(off.offer_id)}>×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {/* --- ADD/EDIT SHOP MODAL --- */}
      {showForm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <button style={s.closeBtn} onClick={() => setShowForm(false)}>×</button>
            <h3 style={{marginTop: 0, marginBottom: "1.5rem", color: colors.primary}}>{editingShop ? TXT.updateShopDetails[lang] : TXT.addNewShop[lang]}</h3>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"}}>
              <input style={s.input} placeholder={TXT.shopName[lang]} value={form.shop_name} onChange={e => handleInputChange("shop_name", e.target.value)} />
              <div style={{position: "relative"}}>
                <input style={{...s.input, borderColor: (!citySelected && form.city_name) ? "red" : colors.border}} placeholder={TXT.cityName[lang]} value={form.city_name} onChange={e => onCityTyping(e.target.value)} />
                {citySug.length > 0 && (
                  <div style={{position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #ddd", zIndex: 10, maxHeight: "150px", overflowY: "auto", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", borderRadius: "8px"}}>
                    {citySug.map(c => (
                      <div key={c._id} style={{padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "0.9rem"}} onClick={() => {
                        handleInputChange("city_id", c._id); handleInputChange("city_name", c.city_name);
                        handleInputChange("district", c.district); handleInputChange("pincode", c.pincode);
                        handleInputChange("state", c.state); setCitySelected(true); setCitySug([]);
                      }}>
                        <strong>{c.city_name}</strong> - {c.pincode} <span style={{color: colors.subtext}}>({c.district})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"}}>
                <input style={s.input} placeholder={TXT.district[lang]} value={form.district} onChange={e => handleInputChange("district", e.target.value)} />
                <input style={s.input} placeholder={TXT.pincode[lang]} value={form.pincode} onChange={e => handleInputChange("pincode", e.target.value)} />
            </div>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"}}>
                <input style={s.input} placeholder={TXT.state[lang]} value={form.state} onChange={e => handleInputChange("state", e.target.value)} />
                <input style={s.input} placeholder={TXT.landmark[lang]} value={form.landmark} onChange={e => handleInputChange("landmark", e.target.value)} />
            </div>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"}}>
               <input style={s.input} placeholder={TXT.phone[lang]} value={form.phone_number} onChange={e => handleInputChange("phone_number", e.target.value)} />
               <input style={s.input} placeholder={TXT.email[lang]} value={form.email} onChange={e => handleInputChange("email", e.target.value)} />
            </div>

            <input style={s.input} placeholder={TXT.address[lang]} value={form.address} onChange={e => handleInputChange("address", e.target.value)} />

            <textarea style={{...s.input, height: "80px", fontFamily: "inherit"}} placeholder={TXT.description[lang]} value={form.description} onChange={e => handleInputChange("description", e.target.value)} />

            <div style={{position: "relative"}}>
              <input style={s.input} placeholder={TXT.categoryList[lang]} value={form.category_list} onChange={e => onCategoryTyping(e.target.value)} />
              {categorySug.length > 0 && (
                 <div style={{position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #ddd", zIndex: 10, maxHeight: "150px", overflowY: "auto", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", borderRadius: "8px"}}>
                    {categorySug.map(c => (
                       <div key={c._id} style={{padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "0.9rem"}} onClick={() => {
                          const parts = form.category_list.split(","); parts[parts.length - 1] = c.name;
                          handleInputChange("category_list", parts.join(",") + ", "); setCategorySug([]);
                       }}>{c.name}</div>
                    ))}
                 </div>
              )}
            </div>

            <input style={s.input} placeholder={TXT.keywordsPlaceholder[lang]} value={form.keywords} onChange={e => handleInputChange("keywords", e.target.value)} />

            {/* ----------------- MAIN IMAGE SECTION ----------------- */}
            <div style={{borderTop: "1px solid " + colors.border, paddingTop: "1.5rem", marginTop: "1.5rem"}}>
               <label style={{display: "block", fontWeight: "600", marginBottom: "8px", color: colors.text}}>
                  Main Image (Single)
                  <span style={{fontSize: "0.85rem", fontWeight: "normal", color: colors.subtext, marginLeft: "10px"}}>
                     ({TXT.uploadHintAdd[lang]})
                  </span>
               </label>

               <input
                  type="file"
                  ref={mainImageInputRef}
                  accept="image/*"
                  onChange={handleMainImageSelect}
                  style={{marginBottom: "15px", fontSize: "0.9rem"}}
               />

               {/* MAIN IMAGE PREVIEW */}
               {(mainImagePreview || existingMainImage) && (
                 <div style={{padding: "15px", background: colors.bg, borderRadius: "12px", border: "1px solid " + colors.border, display: "inline-block"}}>
                    <div style={{position: "relative", width: 120, height: 120}}>
                        <img
                          src={mainImagePreview || mediaUrl(existingMainImage)}
                          style={{width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, border: "1px solid " + colors.primary}}
                          alt="Main"
                        />
                        {/* Only show Remove button for NEW uploads */}
                        {mainImagePreview && (
                          <button onClick={removeMainImage} style={{position: "absolute", top: -6, right: -6, background: colors.danger, color: "white", borderRadius: "50%", width: 20, height: 20, border: "2px solid white", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center"}}>×</button>
                        )}
                    </div>
                 </div>
               )}
            </div>

            {/* ----------------- SHOP MEDIA GALLERY SECTION ----------------- */}
            <div style={{borderTop: "1px solid " + colors.border, paddingTop: "1.5rem", marginTop: "1.5rem"}}>
              <label style={{display: "block", fontWeight: "600", marginBottom: "8px", color: colors.text}}>
                {TXT.uploadPhotosLabel[lang]}
                <span style={{fontSize: "0.85rem", fontWeight: "normal", color: colors.subtext, marginLeft: "10px"}}>
                   ({editingShop ? TXT.uploadHintUpdate[lang] : TXT.uploadHintAdd[lang]})
                </span>
              </label>

              <input
                type="file"
                ref={fileInputRef}
                // Only allow video selection if editingShop is true
                accept={editingShop ? "image/*,video/*" : "image/*"}
                multiple
                onChange={handleShopFileSelect}
                style={{marginBottom: "15px", fontSize: "0.9rem"}}
              />

              {/* GALLERY PREVIEW AREA */}
              {(existingPhotos.length > 0 || previewImg.length > 0) && (
                  <div style={{display: "flex", gap: "10px", flexWrap: "wrap", padding: "15px", background: colors.bg, borderRadius: "12px", border: "1px solid " + colors.border}}>
                      {/* Existing Photos (Edit Mode) */}
                      {existingPhotos.map((p, i) => (
                      <div key={`exist-${i}`} style={{position: "relative", width: 70, height: 70}}>
                          {p.type === "video" ? (
                              <video src={mediaUrl(p.path)} style={{width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, border: "1px solid #ddd"}} />
                          ) : (
                              <img src={mediaUrl(p.path)} style={{width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, border: "1px solid #ddd"}} alt="" />
                          )}
                          <button onClick={() => deleteExistingPhoto(p.path)} style={{position: "absolute", top: -6, right: -6, background: colors.danger, color: "white", borderRadius: "50%", width: 20, height: 20, border: "2px solid white", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center"}}>×</button>
                      </div>
                      ))}

                      {/* New Previews */}
                      {previewImg.map((p, i) => (
                      <div key={`new-${i}`} style={{position: "relative", width: 70, height: 70}}>
                          {p.type === "video" ? (
                              <video src={p.url} style={{width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, border: "1px solid " + colors.primary}} />
                          ) : (
                              <img src={p.url} style={{width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, border: "1px solid " + colors.primary}} alt="" />
                          )}
                          <button onClick={() => removeNewPreview(i)} style={{position: "absolute", top: -6, right: -6, background: colors.danger, color: "white", borderRadius: "50%", width: 20, height: 20, border: "2px solid white", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center"}}>×</button>
                      </div>
                      ))}
                  </div>
              )}
            </div>

            <div style={{display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "2rem"}}>
               <button style={s.btn(colors.subtext)} onClick={() => setShowForm(false)}>{TXT.cancel[lang]}</button>
               <button style={{...s.btn(colors.success), opacity: saving ? 0.7 : 1}} onClick={submitShopForm} disabled={saving}>{saving ? TXT.saving[lang] : TXT.save[lang]}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD OFFER MODAL --- */}
      {showOfferForm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <button style={s.closeBtn} onClick={() => setShowOfferForm(false)}>×</button>
            <h3 style={{marginTop: 0, marginBottom: "1.5rem", color: colors.primary}}>{TXT.addNewOffer[lang]}</h3>

            <select style={s.input} value={offerForm.shop_id} onChange={e => setOfferForm(prev => ({...prev, shop_id: e.target.value}))}>
               <option value="">{TXT.selectShop[lang]}</option>
               {shops.map(s => <option key={s.shop._id} value={s.shop._id}>{s.shop.shop_name} - {s.city?.city_name}</option>)}
            </select>

            <input style={s.input} placeholder={TXT.offerTitle[lang]} value={offerForm.title} onChange={e => setOfferForm(prev => ({...prev, title: e.target.value}))} />

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"}}>
               <input style={s.input} placeholder={TXT.feeOptional[lang]} value={offerForm.fee} onChange={e => setOfferForm(prev => ({...prev, fee: e.target.value}))} />
               <input style={s.input} placeholder={TXT.percentageLimit[lang]} value={offerForm.percentage} onChange={e => setOfferForm(prev => ({...prev, percentage: e.target.value}))} />
            </div>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"}}>
               <div style={{marginBottom: "1rem"}}>
                  <label style={{display:"block", fontSize:"0.85rem", color: colors.subtext, marginBottom:"4px"}}>Start Date</label>
                  <input type="date" style={{...s.input, marginBottom:0}} value={offerForm.start_date} onChange={e => setOfferForm(prev => ({...prev, start_date: e.target.value}))} />
               </div>
               <div style={{marginBottom: "1rem"}}>
                  <label style={{display:"block", fontSize:"0.85rem", color: colors.subtext, marginBottom:"4px"}}>End Date</label>
                  <input type="date" style={{...s.input, marginBottom:0}} value={offerForm.end_date} onChange={e => setOfferForm(prev => ({...prev, end_date: e.target.value}))} />
               </div>
            </div>

            <textarea style={{...s.input, height: "80px", fontFamily: "inherit"}} placeholder={TXT.description[lang]} value={offerForm.description} onChange={e => setOfferForm(prev => ({...prev, description: e.target.value}))} />

            <div style={{marginBottom: "1.5rem"}}>
              <label style={{display: "block", fontWeight: "600", marginBottom: "8px", color: colors.text}}>{TXT.mediaFileLabel[lang]}</label>
              <input type="file" accept="image/*,video/*" onChange={e => handleOfferFile(e.target.files[0], false)} style={{marginBottom: "10px", fontSize:"0.9rem"}} />
              {offerPreview && (
                <div style={{padding: "10px", background: colors.bg, borderRadius: "8px", border: "1px solid " + colors.border, display: "inline-block"}}>
                   {offerForm.file?.type.startsWith("video/") ? (
                      <video src={offerPreview} style={{height: 100, borderRadius: 6}} autoPlay loop muted />
                   ) : (
                      <img src={offerPreview} style={{height: 100, borderRadius: 6}} alt="" />
                   )}
                </div>
              )}
            </div>

            <button style={{...s.btn(colors.success), width: "100%", justifyContent: "center", padding: "0.8rem"}} onClick={() => submitOffer(false)} disabled={offerUploading}>
              {offerUploading ? TXT.uploading[lang] : TXT.uploadOffer[lang]}
            </button>
          </div>
        </div>
      )}

      {/* --- UPDATE OFFER MODAL --- */}
      {showUpdateOfferForm && (
        <div style={s.overlay}>
           <div style={s.modal}>
            <button style={s.closeBtn} onClick={() => setShowUpdateOfferForm(false)}>×</button>
            <h3 style={{marginTop: 0, marginBottom: "1.5rem", color: colors.primary}}>{TXT.updateOffer[lang]}</h3>
            <input style={s.input} value={updateOfferForm.title} onChange={e => setUpdateOfferForm(p => ({...p, title: e.target.value}))} placeholder={TXT.offerTitle[lang]} />

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"}}>
               <input style={s.input} placeholder={TXT.feeOptional[lang]} value={updateOfferForm.fee} onChange={e => setUpdateOfferForm(prev => ({...prev, fee: e.target.value}))} />
               <input style={s.input} placeholder={TXT.percentageLimit[lang]} value={updateOfferForm.percentage} onChange={e => setUpdateOfferForm(prev => ({...prev, percentage: e.target.value}))} />
            </div>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"}}>
               <div style={{marginBottom: "1rem"}}>
                  <label style={{display:"block", fontSize:"0.85rem", color: colors.subtext, marginBottom:"4px"}}>Start Date</label>
                  <input type="date" style={{...s.input, marginBottom:0}} value={updateOfferForm.start_date} onChange={e => setUpdateOfferForm(p => ({...p, start_date: e.target.value}))} />
               </div>
               <div style={{marginBottom: "1rem"}}>
                  <label style={{display:"block", fontSize:"0.85rem", color: colors.subtext, marginBottom:"4px"}}>End Date</label>
                  <input type="date" style={{...s.input, marginBottom:0}} value={updateOfferForm.end_date} onChange={e => setUpdateOfferForm(p => ({...p, end_date: e.target.value}))} />
               </div>
            </div>

             <textarea style={{...s.input, height: "80px", fontFamily: "inherit"}} placeholder={TXT.description[lang]} value={updateOfferForm.description} onChange={e => setUpdateOfferForm(prev => ({...prev, description: e.target.value}))} />

            <div style={{marginBottom: "1.5rem"}}>
                <label style={{display: "block", fontWeight: "600", marginBottom: "8px", color: colors.text}}>{TXT.replaceMedia[lang]}</label>
                <input type="file" accept="image/*,video/*" onChange={e => handleOfferFile(e.target.files[0], true)} style={{display: "block", marginTop: "5px", marginBottom: "15px", fontSize:"0.9rem"}} />
                {updateOfferPreview && (
                   <div style={{padding: "10px", background: colors.bg, borderRadius: "8px", border: "1px solid " + colors.border, display: "inline-block"}}>
                      {updateOfferPreview.endsWith(".mp4") || (updateOfferForm.file && updateOfferForm.file.type.startsWith("video/")) ? (
                         <video src={updateOfferPreview} style={{height: 100, borderRadius: 6}} autoPlay loop muted />
                      ) : (
                         <img src={updateOfferPreview} style={{height: 100, borderRadius: 6}} alt="" />
                      )}
                  </div>
                )}
            </div>

            <button style={{...s.btn(colors.primary), width: "100%", justifyContent: "center", padding: "0.8rem"}} onClick={() => submitOffer(true)} disabled={updateOfferSaving}>
               {updateOfferSaving ? TXT.saving[lang] : TXT.updateOffer[lang]}
            </button>
           </div>
        </div>
      )}

      {/* --- FULL SCREEN GALLERY MODAL --- */}
      {gallery.isOpen && (
        <div style={s.galleryOverlay} onClick={() => setGallery({ ...gallery, isOpen: false })}>
           <div style={{padding: "1rem 2rem", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.5)"}}>
             <h3 style={{margin:0, fontSize: "1.1rem"}}>{gallery.shopName} <span style={{fontWeight: "normal", fontSize: "0.9rem", opacity: 0.8}}>({gallery.currentIndex + 1} / {gallery.mediaList.length})</span></h3>
             <button style={{background: "none", border: "none", color: "white", fontSize: "2rem", cursor: "pointer", lineHeight: 1}} onClick={() => setGallery({ ...gallery, isOpen: false })}>×</button>
           </div>

           <div style={s.galleryMain} onClick={e => e.stopPropagation()}>
             {gallery.mediaList.length > 0 && (
               <>
                 <button style={{...s.galleryNav, left: "20px"}} onClick={prevSlide}>‹</button>

                 {gallery.mediaList[gallery.currentIndex].type === "video" ? (
                   <video controls autoPlay src={mediaUrl(gallery.mediaList[gallery.currentIndex].path)} style={s.galleryImg} />
                 ) : (
                   <img src={mediaUrl(gallery.mediaList[gallery.currentIndex].path)} style={s.galleryImg} alt="" />
                 )}

                 <button style={{...s.galleryNav, right: "20px"}} onClick={nextSlide}>›</button>
               </>
             )}
           </div>

           <div style={s.galleryStrip} onClick={e => e.stopPropagation()}>
             {gallery.mediaList.map((m, i) => (
                 <div key={i} onClick={() => setGallery(p => ({...p, currentIndex: i}))} style={{height: "100%"}}>
                    {m.type === "video" ? (
                      <video src={mediaUrl(m.path)} style={s.stripThumb(i === gallery.currentIndex)} muted />
                    ) : (
                      <img src={mediaUrl(m.path)} style={s.stripThumb(i === gallery.currentIndex)} alt="" />
                    )}
                 </div>
             ))}
           </div>
        </div>
      )}

    </div>
  );
}
