// src/components/ProductDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { productsAPI } from "../api/client";

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        productsAPI.getById(id)
            .then(res => setProduct(res.data))
            .catch(() => setError("Товар не найден"))
            .finally(() => setLoading(false));
    }, [id]);

    const handleDelete = async () => {
        if (!confirm("Удалить товар?")) return;
        
        try {
            await productsAPI.delete(id);
            navigate("/products");
        } catch (err) {
            alert("Ошибка удаления");
        }
    };

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="product-detail">
            <Link to="/products">← Назад</Link>
            <h2>{product.title}</h2>
            <p className="category">Категория: {product.category}</p>
            <p className="price">Цена: {product.price} ₽</p>
            <p className="description">{product.description}</p>
            <div className="actions">
                <Link to={`/products/${id}/edit`}>Редактировать</Link>
                <button onClick={handleDelete}>Удалить</button>
            </div>
        </div>
    );
}

export default ProductDetail;   