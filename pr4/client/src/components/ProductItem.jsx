import React from "react";

export default function ProductItem({ product, onEdit, onDelete }) {
  const getStockStatus = (stock) => {
    if (stock <= 0) return "Нет в наличии";
    if (stock < 5) return "Мало";
    if (stock < 15) return "Достаточно";
    return "Много";
  };

  const getStockClass = (stock) => {
    if (stock <= 0) return "stock-badge out";
    if (stock < 5) return "stock-badge low";
    if (stock < 15) return "stock-badge medium";
    return "stock-badge high";
  };

  return (
    <div className="product-card">
      <div className="product-header">
        <span className="product-category">{product.category}</span>
        <span className="product-id">#{product.id}</span>
      </div>

      <div className="product-body">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>

        <div className="product-details">
          <div className="product-price">
            {product.price.toLocaleString()} ₽
          </div>

          <div className={getStockClass(product.stock)}>
            {getStockStatus(product.stock)} ({product.stock} шт.)
          </div>

          {product.rating > 0 && (
            <div className="product-rating">
              ⭐ {product.rating.toFixed(1)}
            </div>
          )}
        </div>
      </div>

      <div className="product-actions">
        <button className="btn btn--primary" onClick={() => onEdit(product)}>
          ✏️ Редактировать
        </button>
        <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
          🗑️ Удалить
        </button>
      </div>
    </div>
  );
}