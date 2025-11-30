import React, { useEffect, useRef, useState } from "react";

function Dashboard() {
  const [shops, setShops] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const backend = "http://127.0.0.1:8000";

  const [form, setForm] = useState({
    shop_name: "",
    description: "",
    address: "",
    phone_number: "",
    email: "",
    landmark: "",
    category_list: "",
    city_name: "",
    district: "",
    pincode: "",
    state: "",
    photo: [],
    keywords: "",
  });

  const [previewImg, setPreviewImg] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [categorySug, setCategorySug] = useState([]);
  const [citySug, setCitySug] = useState([]);
  const typingRef = useRef(null);

  // OFFER FORM STATES
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerForm, setOfferForm] = useState({
    shop_id: "",
    file: null,
  });
  const [offerPreview, setOfferPreview] = useState(null);

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("SHOP_DATA");
    localStorage.removeItem("USER_ID");
    window.location.href = "/";
  };

  // Load saved shops
  useEffect(() => {
    const data = localStorage.getItem("SHOP_DATA");
    if (data) {
      try {
        setShops(JSON.parse(data));
      } catch {}
    }
  }, []);

  useEffect(() => {
    return () => {
      previewImg.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
      if (offerPreview) {
        try {
          URL.revokeObjectURL(offerPreview);
        } catch {}
      }
    };
  }, [previewImg, offerPreview]);

  const getUserId = () => {
    const id = localStorage.getItem("USER_ID");
    if (id) return id;

    try {
      const data = JSON.parse(localStorage.getItem("SHOP_DATA"));
      return data?.[0]?.shop?.user_id || null;
    } catch {
      return null;
    }
  };

  const reloadShops = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const res = await fetch(`${backend}/get_shops/${userId}`);
      const data = await res.json();
      if (data.status === "success") {
        setShops(data.data);
        localStorage.setItem("SHOP_DATA", JSON.stringify(data.data));
      }
    } catch {}
  };

  useEffect(() => {
    const userId = localStorage.getItem("USER_ID");
    if (userId) reloadShops();
  }, []);

  const handleChange = (field, value) => {
    setForm((s) => ({ ...s, [field]: value }));
  };

  const handleAddOpen = () => {
    setEditingShop(null);
    setForm({
      shop_name: "",
      description: "",
      address: "",
      phone_number: "",
      email: "",
      landmark: "",
      category_list: "",
      city_name: "",
      district: "",
      pincode: "",
      state: "",
      photo: [],
      keywords: "",
    });
    previewImg.forEach((u) => URL.revokeObjectURL(u));
    setPreviewImg([]);
    setExistingPhotos([]);
    setCategorySug([]);
    setCitySug([]);
    setShowForm(true);
  };

  const handleUpdateOpen = (item) => {
    setEditingShop(item.shop._id);
    setForm({
      shop_name: item.shop.shop_name || "",
      description: item.shop.description || "",
      address: item.shop.address || "",
      phone_number: item.shop.phone_number || "",
      email: item.shop.email || "",
      landmark: item.shop.landmark || "",
      category_list: item.categories
        ? item.categories.map((c) => c.name).join(",")
        : "",
      city_name: item.city?.city_name || "",
      district: item.city?.district || "",
      pincode: item.city?.pincode || "",
      state: item.city?.state || "",
      photo: [],
      keywords: Array.isArray(item.shop.keywords)
        ? item.shop.keywords.join(",")
        : item.shop.keywords || "",
    });

    previewImg.forEach((u) => URL.revokeObjectURL(u));
    setPreviewImg([]);
    setExistingPhotos(item.shop.photos || []);
    setCategorySug([]);
    setCitySug([]);
    setShowForm(true);
  };

  // ADD SHOP
  const handleAddShop = async () => {
    setErrorMsg("");
    const userId = getUserId();
    if (!userId) {
      setErrorMsg("User not found");
      return;
    }

    const fd = new FormData();
    fd.append("user_id", userId);

    Object.keys(form).forEach((k) => {
      if (k === "photo" && form.photo.length > 0) {
        form.photo.forEach((f) => fd.append("photos", f));
      } else {
        fd.append(k, form[k] ?? "");
      }
    });

    try {
      const res = await fetch(`${backend}/add_shop/`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.status === "success") {
        await reloadShops();
        setShowForm(false);
      } else setErrorMsg(data.message || "Add failed");
    } catch {
      setErrorMsg("Server Error");
    }
  };

  // UPDATE SHOP
  const handleUpdateShop = async () => {
    setErrorMsg("");

    const fd = new FormData();
    fd.append("shop_id", editingShop);

    Object.keys(form).forEach((k) => {
      if (k === "photo" && form.photo.length > 0) {
        form.photo.forEach((f) => fd.append("photos", f));
      } else {
        fd.append(k, form[k] ?? "");
      }
    });

    try {
      const res = await fetch(`${backend}/update_shop/`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (data.status === "success") {
        await reloadShops();
        setShowForm(false);
      } else setErrorMsg(data.message || "Update failed");
    } catch {
      setErrorMsg("Update failed");
    }
  };

  // DELETE SHOP
  const handleDelete = async (id) => {
    setErrorMsg("");

    if (!window.confirm("Delete this shop?")) return;
    setDeletingId(id);

    const fd = new FormData();
    fd.append("shop_id", id);

    try {
      const res = await fetch(`${backend}/delete_shop/`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (data.status === "success") {
        const updated = shops.filter((x) => x.shop._id !== id);
        setShops(updated);
        localStorage.setItem("SHOP_DATA", JSON.stringify(updated));
        reloadShops();
      } else setErrorMsg(data.message || "Delete failed");
    } catch {
      setErrorMsg("Delete failed");
    }
    setDeletingId(null);
  };

  // DELETE PHOTO
  const handleDeletePhoto = async (index) => {
    if (!window.confirm("Delete this photo?")) return;

    const fd = new FormData();
    fd.append("shop_id", editingShop);
    fd.append("photo_index", index);

    try {
      const res = await fetch(`${backend}/delete_photo/`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (data.status === "success") {
        const updated = existingPhotos.filter((_, i) => i !== index);
        setExistingPhotos(updated);
        reloadShops();
      } else setErrorMsg(data.message || "Photo delete failed");
    } catch {
      setErrorMsg("Photo delete failed");
    }
  };

  // REMOVE OFFER
  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm("Delete this offer?")) return;

    const fd = new FormData();
    fd.append("offer_id", offerId);

    try {
      const res = await fetch(`${backend}/delete_offer/`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (data.status === "success") {
        await reloadShops();
        alert("Offer deleted");
      } else {
        alert("Delete failed");
      }
    } catch {
      alert("Server Error");
    }
  };

  // CATEGORY SEARCH
  const fetchCategory = async (text) => {
    if (!text.trim()) return setCategorySug([]);
    try {
      const res = await fetch(
        `${backend}/search_category?query=${encodeURIComponent(text)}`
      );
      const data = await res.json();
      if (data.status === "success") setCategorySug(data.data || []);
    } catch {}
  };

  const onCategoryTyping = (value) => {
    const lastWord = value.split(",").pop().trim();
    setForm((s) => ({ ...s, category_list: value }));
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => fetchCategory(lastWord), 300);
  };

  // CITY SEARCH
  const fetchCity = async (text) => {
    if (!text.trim()) return setCitySug([]);
    try {
      const res = await fetch(
        `${backend}/search_city?query=${encodeURIComponent(text)}`
      );
      const data = await res.json();
      if (data.status === "success") setCitySug(data.data || []);
    } catch {}
  };

  const onCityTyping = (value) => {
    setForm((s) => ({ ...s, city_name: value }));
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => fetchCity(value), 300);
  };

  // FILE PREVIEW
  const onFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const combined = [...form.photo, ...files];

    previewImg.forEach((u) => URL.revokeObjectURL(u));
    const previews = combined.map((f) => URL.createObjectURL(f));

    setForm((prev) => ({ ...prev, photo: combined }));
    setPreviewImg(previews);
  };

  // ADD OFFER
  const handleAddOffer = async () => {
    if (!offerForm.file) {
      alert("Please upload image or video");
      return;
    }

    const userId = getUserId();

    const fd = new FormData();
    fd.append("user_id", userId);
    fd.append("target_shop", offerForm.shop_id);
    fd.append("file", offerForm.file);

    try {
      const res = await fetch(`${backend}/add_offer/`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (data.status === "success") {
        await reloadShops();
        alert("Offer Uploaded");

        setShowOfferForm(false);
        setOfferForm({ shop_id: "", file: null });

        if (offerPreview) {
          try {
            URL.revokeObjectURL(offerPreview);
          } catch {}
        }
        setOfferPreview(null);
      } else {
        alert("Upload Failed");
      }
    } catch {
      alert("Server Error");
    }
  };

  return (
    <div style={styles.page}>
      <h1>Your Shops</h1>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button style={styles.btnRed} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

      <button style={styles.btnGreen} onClick={handleAddOpen}>
        + Add Shop
      </button>

      <button style={styles.btnBlue} onClick={() => setShowOfferForm(true)}>
        + Add Offer
      </button>

      {shops.length === 0 ? (
        <p>No shops found</p>
      ) : (
        shops.map((item, idx) => (
          <div key={idx} style={styles.card}>
            {item.shop.photos?.length > 0 && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {item.shop.photos.map((p, i) => (
                  <img
                    key={i}
                    src={`data:image/jpeg;base64,${p}`}
                    style={{
                      width: "150px",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      border: "2px solid #ddd",
                    }}
                    alt=""
                  />
                ))}
              </div>
            )}

            <h2>{item.shop.shop_name}</h2>
            <p><b>Description:</b> {item.shop.description}</p>
            <p><b>Address:</b> {item.shop.address}</p>
            <p><b>Phone:</b> {item.shop.phone_number}</p>
            <p><b>Email:</b> {item.shop.email}</p>
            <p><b>Landmark:</b> {item.shop.landmark}</p>

            <h3>Categories:</h3>
            <ul>
              {item.categories?.length > 0 ? (
                item.categories.map((c) => <li key={c._id}>{c.name}</li>)
              ) : (
                <li>No categories</li>
              )}
            </ul>

            <h3>City</h3>
            {item.city ? (
              <>
                <p>City: {item.city.city_name}</p>
                <p>District: {item.city.district}</p>
                <p>Pincode: {item.city.pincode}</p>
                <p>State: {item.city.state}</p>
              </>
            ) : (
              <p>No city data</p>
            )}

            {/* OFFERS */}
            {item.offers?.length > 0 && (
              <div style={{ marginTop: 15 }}>
                <h3>Offers</h3>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {item.offers.map((off, i) => {
                    const type = item.offer_types?.[i] || "image";

                    return (
                      <div key={i} style={{ position: "relative" }}>
                        {type === "video" ? (
                          <video
                            src={`data:video/mp4;base64,${off}`}
                            style={{
                              width: "150px",
                              height: "150px",
                              borderRadius: "10px",
                              border: "2px solid #ddd",
                              objectFit: "cover",
                            }}
                            controls
                          />
                        ) : (
                          <img
                            src={`data:image/jpeg;base64,${off}`}
                            style={{
                              width: "150px",
                              height: "150px",
                              borderRadius: "10px",
                              border: "2px solid #ddd",
                              objectFit: "cover",
                            }}
                          />
                        )}

                        <button
                          onClick={() => handleDeleteOffer(item.offer_ids[i])}
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            background: "red",
                            color: "white",
                            borderRadius: "50%",
                            width: 22,
                            height: 22,
                            border: "none",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          X
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={styles.btnRow}>
              <button style={styles.btnBlue} onClick={() => handleUpdateOpen(item)}>
                Update
              </button>
              <button
                style={{
                  ...styles.btnRed,
                  opacity: deletingId === item.shop._id ? 0.6 : 1,
                }}
                onClick={() => handleDelete(item.shop._id)}
                disabled={deletingId === item.shop._id}
              >
                {deletingId === item.shop._id ? "Deleting..." : "Delete"}
              </button>
            </div>

          </div>
        ))
      )}

      {/* SHOP FORM */}
      {showForm && (
        <div style={styles.popupBg}>
          <div style={styles.popup}>
            <h2>{editingShop ? "Update Shop" : "Add Shop"}</h2>

            {existingPhotos.length > 0 && (
              <>
                <h4>Saved Photos</h4>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {existingPhotos.map((p, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img
                        src={`data:image/jpeg;base64,${p}`}
                        style={{
                          width: "100px",
                          height: "100px",
                          borderRadius: "8px",
                          border: "1px solid #ccc",
                          objectFit: "cover",
                        }}
                      />
                      <button
                        onClick={() => handleDeletePhoto(i)}
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          background: "red",
                          color: "white",
                          borderRadius: "50%",
                          width: 22,
                          height: 22,
                          border: "none",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <input
              type="file"
              accept="image/*"
              multiple
              style={styles.input}
              onChange={onFileChange}
            />

            {previewImg.length > 0 && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {previewImg.map((src, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img
                      src={src}
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "10px",
                        border: "2px solid #ddd",
                      }}
                    />
                    <button
                      onClick={() => handleRemovePreview(i)}
                      style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        background: "black",
                        color: "white",
                        borderRadius: "50%",
                        width: "22px",
                        height: "22px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* FORM INPUTS */}
            <input
              style={styles.input}
              placeholder="SHOP NAME"
              value={form.shop_name}
              onChange={(e) => handleChange("shop_name", e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="DESCRIPTION"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="ADDRESS"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="PHONE NUMBER"
              value={form.phone_number}
              onChange={(e) => handleChange("phone_number", e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="EMAIL"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="LANDMARK"
              value={form.landmark}
              onChange={(e) => handleChange("landmark", e.target.value)}
            />

            {/* CATEGORY */}
            <div style={{ position: "relative" }}>
              <input
                style={styles.input}
                placeholder="CATEGORY LIST"
                value={form.category_list}
                onChange={(e) => onCategoryTyping(e.target.value)}
              />
              {categorySug.length > 0 && (
                <div style={styles.dropdown}>
                  {categorySug.map((cat) => (
                    <div
                      key={cat._id}
                      style={styles.dropItem}
                      onClick={() => {
                        const parts = form.category_list.split(",");
                        parts[parts.length - 1] = cat.name;
                        handleChange("category_list", parts.join(",") + ", ");
                        setCategorySug([]);
                      }}
                    >
                      {cat.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CITY */}
            <div style={{ position: "relative" }}>
              <input
                style={styles.input}
                placeholder="CITY"
                value={form.city_name}
                onChange={(e) => onCityTyping(e.target.value)}
              />
              {citySug.length > 0 && (
                <div style={styles.dropdown}>
                  {citySug.map((city) => (
                    <div
                      key={city._id}
                      style={styles.dropItem}
                      onClick={() => {
                        handleChange("city_name", city.city_name);
                        handleChange("district", city.district);
                        handleChange("pincode", city.pincode);
                        handleChange("state", city.state);
                        setCitySug([]);
                      }}
                    >
                      {city.city_name} — {city.district} ({city.pincode})
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              style={styles.input}
              placeholder="DISTRICT"
              value={form.district}
              onChange={(e) => handleChange("district", e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="PINCODE"
              value={form.pincode}
              onChange={(e) => handleChange("pincode", e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="STATE"
              value={form.state}
              onChange={(e) => handleChange("state", e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="KEYWORDS"
              value={form.keywords}
              onChange={(e) => handleChange("keywords", e.target.value)}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={styles.btnGreen}
                onClick={editingShop ? handleUpdateShop : handleAddShop}
              >
                {editingShop ? "Update" : "Add"}
              </button>
              <button style={styles.btnRed} onClick={() => setShowForm(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFER POPUP */}
      {showOfferForm && (
        <div style={styles.popupBg}>
          <div style={styles.popup}>
            <h2>Add Offer</h2>

            <select
              style={styles.input}
              value={offerForm.shop_id}
              onChange={(e) =>
                setOfferForm({ ...offerForm, shop_id: e.target.value })
              }
            >
              <option value="">-- Select Shop --</option>
              <option value="ALL">All Shops</option>
              {shops.map((s) => (
                <option key={s.shop._id} value={s.shop._id}>
                  {s.shop.shop_name}
                </option>
              ))}
            </select>

            <input
              style={styles.input}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                const f = e.target.files[0];
                setOfferForm({ ...offerForm, file: f });
                if (offerPreview) {
                  try {
                    URL.revokeObjectURL(offerPreview);
                  } catch {}
                }
                setOfferPreview(URL.createObjectURL(f));
              }}
            />

            {offerPreview && (
              <>
                {offerForm.file && offerForm.file.type.startsWith("video/") ? (
                  <video
                    src={offerPreview}
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      marginBottom: "10px",
                    }}
                    controls
                  />
                ) : (
                  <img
                    src={offerPreview}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      marginBottom: "10px",
                    }}
                    alt="offer preview"
                  />
                )}
              </>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button style={styles.btnGreen} onClick={handleAddOffer}>
                Upload Offer
              </button>
              <button
                style={styles.btnRed}
                onClick={() => {
                  setShowOfferForm(false);
                  if (offerPreview) {
                    try {
                      URL.revokeObjectURL(offerPreview);
                    } catch {}
                  }
                  setOfferPreview(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* STYLES */
const styles = {
  page: {
    padding: "20px",
    background: "#f5f5f5",
    minHeight: "100vh",
  },
  card: {
    background: "#fff",
    padding: "20px",
    marginBottom: "20px",
    borderRadius: "12px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  btnBlue: {
    padding: "10px 20px",
    background: "blue",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
    marginLeft: "10px",
  },
  btnRed: {
    padding: "10px 20px",
    background: "red",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
  },
  btnGreen: {
    padding: "10px 20px",
    background: "green",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
  },
  btnRow: {
    display: "flex",
    gap: "10px",
    marginTop: "15px",
  },
  popupBg: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    width: "400px",
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 0 10px rgba(0,0,0,0.3)",
  },
  input: {
    width: "95%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #aaa",
    marginBottom: "10px",
  },
  errorBox: {
    background: "#ffe6e6",
    padding: "12px",
    borderRadius: "8px",
    color: "red",
    marginBottom: "15px",
  },
  dropdown: {
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "8px",
    maxHeight: "150px",
    overflowY: "auto",
    marginTop: "-8px",
    marginBottom: "10px",
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  dropItem: {
    padding: "10px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
  },
};

export default Dashboard;
