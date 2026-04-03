// src/components/ProductForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { productsAPI } from "../api/client";

function ProductForm({ edit }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ title: "", category: "", description: "", price: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (edit && id) {
            productsAPI.getById(id)
                .then(res => setForm(res.data))
                .catch(() => setError("Товар не найден"));
        }
    }, [edit, id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            if (edit) {
                await productsAPI.update(id, { ...form, price: Number(form.price) });
            } else {
                await productsAPI.create({ ...form, price: Number(form.price) });
            }
            navigate("/products");
        } catch (err) {
            setError(err.response?.data?.error || "Ошибка сохранения");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>{edit ? "Редактировать товар" : "Создать товар"}</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Название"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Категория"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                />
                <textarea
                    placeholder="Описание"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />
                <input
                    type="number"
                    placeholder="Цена"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Сохранение..." : (edit ? "Обновить" : "Создать")}
                </button>
                <button type="button" onClick={() => navigate("/products")}>Отмена</button>
            </form>
        </div>
    );
}

export default ProductForm;