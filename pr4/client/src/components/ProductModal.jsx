import React, { useEffect, useState } from "react";

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    stock: "",
    rating: ""
  });

  useEffect(() => {
    if (!open) return;
    
    if (initialProduct) {
      setFormData({
        name: initialProduct.name || "",
        category: initialProduct.category || "",
        description: initialProduct.description || "",
        price: initialProduct.price?.toString() || "",
        stock: initialProduct.stock?.toString() || "",
        rating: initialProduct.rating?.toString() || ""
      });
    } else {
      setFormData({
        name: "",
        category: "",
        description: "",
        price: "",
        stock: "",
        rating: ""
      });
    }
  }, [open, initialProduct]);

  if (!open) return null;

  const title = mode === "edit" ? "Редактирование товара" : "Добавление товара";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const name = formData.name.trim();
    const category = formData.category.trim();
    const description = formData.description.trim();
    const price = Number(formData.price);
    const stock = Number(formData.stock);
    const rating = formData.rating ? Number(formData.rating) : 0;

    // Валидация
    if (!name) {
      alert("Введите название товара");
      return;
    }

    if (!category) {
      alert("Введите категорию");
      return;
    }

    if (!description) {
      alert("Введите описание");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      alert("Введите корректную цену (положительное число)");
      return;
    }

    if (!Number.isFinite(stock) || stock < 0) {
      alert("Введите корректное количество (неотрицательное число)");
      return;
    }

    if (rating && (!Number.isFinite(rating) || rating < 0 || rating > 5)) {
      alert("Рейтинг должен быть от 0 до 5");
      return;
    }

    onSubmit({
      id: initialProduct?.id,
      name,
      category,
      description,
      price,
      stock,
      rating
    });
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button className="iconBtn" onClick={onClose}>✕</button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название товара *
            <input
              className="input"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Например, Ноутбук ASUS"
              autoFocus
            />
          </label>

          <div className="form-row">
            <label className="label">
              Категория *
              <input
                className="input"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Например, Ноутбуки"
              />
            </label>

            <label className="label">
              Цена * (₽)
              <input
                className="input"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder="75000"
              />
            </label>
          </div>

          <label className="label">
            Описание *
            <textarea
              className="textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Подробное описание товара..."
            />
          </label>

          <div className="form-row">
            <label className="label">
              Количество на складе *
              <input
                className="input"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={formData.stock}
                onChange={handleChange}
                placeholder="15"
              />
            </label>

            <label className="label">
              Рейтинг (0-5)
              <input
                className="input"
                name="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={handleChange}
                placeholder="4.5"
              />
            </label>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === "edit" ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}