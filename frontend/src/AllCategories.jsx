import React, { useEffect, useState } from "react";
import { Button, Spinner } from "@blueprintjs/core";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Navbar from "./Navbar"; // Adjust path as needed

const AllCategories = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Ensure backend handles 'limit=all' or just returns list
                const res = await fetch(`http://127.0.0.1:8000/category/list/?lang=${i18n.language}`);
                const json = await res.json();
                setCategories(json.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [i18n.language]);

    const handleCategoryClick = (cat) => {
        // Simple navigate to search results
        const city = sessionStorage.getItem("CITY_NAME") || "";
        navigate(`/results?category=${encodeURIComponent(cat.name)}&city=${encodeURIComponent(city)}`);
    };

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
            <Navbar />
            <div className="container py-5">
                <div className="d-flex align-items-center mb-4">
                    <Button icon="arrow-left" minimal large onClick={() => navigate(-1)} style={{ marginRight: 10 }} />
                    <h2 style={{ fontWeight: 800, color: '#1e293b', margin: 0 }}>{t("All categories")}</h2>
                </div>

                {loading ? (
                    <div className="text-center py-5"><Spinner intent="primary" /></div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '20px' }}
                    >
                        {categories.map((cat, idx) => (
                            <div key={idx}
                                onClick={() => handleCategoryClick(cat)}
                                style={{
                                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
                                    padding: '20px 10px', textAlign: 'center', cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                {cat.category_image ? (
                                    <img src={`http://127.0.0.1:8000/${cat.category_image}`} alt={cat.name}
                                         style={{ width: 50, height: 50, borderRadius: '50%', marginBottom: 10, objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#e0f2fe', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0284c7' }}>
                                        {cat.name[0]}
                                    </div>
                                )}
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{cat.name}</div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AllCategories;