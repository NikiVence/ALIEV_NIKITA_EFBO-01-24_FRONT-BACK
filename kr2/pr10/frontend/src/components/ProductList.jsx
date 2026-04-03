// src/components/ProductList.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productsAPI } from "../api/client";

function ProductList() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const response = await productsAPI.getAll();
            setProducts(response.data);
        } catch (err) {
            setError("Ошибка загрузки товаров");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Удалить товар?")) return;
        
        try {
            await productsAPI.delete(id);
            setProducts(products.filter(p => p.id !== id));
        } catch (err) {
            alert("Ошибка удаления");
        }
    };

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div>
            <div className="header">
                <h2>Товары</h2>
                <Link to="/products/create" className="btn">Создать товар</Link>
            </div>
            
            <div className="products-grid">
                {products.map(product => (
                    <div key={product.id} className="product-card">
                        <h3>{product.title}</h3>
                        <p className="category">{product.category}</p>
                        <p className="price">{product.price} ₽</p>
                        <p className="description">{product.description.substring(0, 100)}...</p>
                        <div className="actions">
                            <Link to={`/products/${product.id}`}>Подробнее</Link>
                            <Link to={`/products/${product.id}/edit`}>Редактировать</Link>
                            <button onClick={() => handleDelete(product.id)}>Удалить</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ProductList;