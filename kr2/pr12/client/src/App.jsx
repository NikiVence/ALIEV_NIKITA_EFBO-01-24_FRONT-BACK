import { useEffect, useState } from "react";
import {
  registerUser,
  loginUser,
  saveTokens,
  getProducts,
  createProduct,
  deleteProduct,
  getProductById,
  updateProduct,
  getCurrentUser,
  getUsers,
  updateUser,
  blockUser,
  unblockUser,
  logout,
} from "./api";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("login");
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [category, setCategory] = useState("все");
  const [usersList, setUsersList] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUser();
    loadProducts();
  }, []);

  async function loadUser() {
    const res = await getCurrentUser();
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      setPage("products");
    }
  }

  async function loadProducts() {
    const res = await getProducts();
    if (res.ok) {
      const data = await res.json();
      setProducts(data);
    } else {
      setProducts([]);
    }
  }

  async function loadUsers() {
    const res = await getUsers();
    if (res.ok) {
      const data = await res.json();
      setUsersList(data);
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
    setPage("login");
  }

  async function handleLogin(e) {
    e.preventDefault();
    const form = new FormData(e.target);

    const res = await loginUser({
      email: form.get("email"),
      password: form.get("password"),
    });

    const data = await res.json();

    if (res.ok) {
      saveTokens(data.accessToken, data.refreshToken);

      const meRes = await getCurrentUser();
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData);
      }

      const productsRes = await getProducts();
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      setPage("products");
    } else {
      alert(data.error || "ошибка входа");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const form = new FormData(e.target);

    const res = await registerUser({
      email: form.get("email"),
      first_name: form.get("first_name"),
      last_name: form.get("last_name"),
      password: form.get("password"),
      role: form.get("role"),
    });

    const data = await res.json();

    if (res.ok) {
      alert("регистрация успешна");
      setPage("login");
    } else {
      alert(data.error || "ошибка регистрации");
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("удалить мотоцикл?");
    if (!ok) return;

    const res = await deleteProduct(id);
    if (res.ok) {
      loadProducts();
    } else {
      alert("ошибка удаления");
    }
  }

  async function openDetails(id) {
    const res = await getProductById(id);
    const data = await res.json();

    if (res.ok) {
      setSelectedProduct(data);
      setPage("details");
    } else {
      alert(data.error || "мотоцикл не найден");
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    const form = new FormData(e.target);

    const res = await createProduct({
      name: form.get("name"),
      category: form.get("category"),
      description: form.get("description"),
      price: Number(form.get("price")),
      stock: Number(form.get("stock")),
      engine: form.get("engine"),
      year: Number(form.get("year")),
    });

    if (res.ok) {
      setPage("products");
      loadProducts();
    } else {
      alert("ошибка создания");
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    const form = new FormData(e.target);

    const res = await updateProduct(selectedProduct.id, {
      name: form.get("name"),
      category: form.get("category"),
      description: form.get("description"),
      price: Number(form.get("price")),
      stock: Number(form.get("stock")),
      engine: form.get("engine"),
      year: Number(form.get("year")),
    });

    if (res.ok) {
      setPage("products");
      loadProducts();
    } else {
      alert("ошибка редактирования");
    }
  }

  async function handleUpdateUser(e) {
    e.preventDefault();
    const form = new FormData(e.target);

    const res = await updateUser(editingUser.id, {
      first_name: form.get("first_name"),
      last_name: form.get("last_name"),
      role: form.get("role"),
      isBlocked: editingUser.isBlocked,
    });

    if (res.ok) {
      alert("пользователь обновлен");
      setEditingUser(null);
      loadUsers();
    } else {
      alert("ошибка обновления");
    }
  }

  async function handleBlockUser(userId, isBlocked) {
    if (isBlocked) {
      const res = await unblockUser(userId);
      if (res.ok) {
        alert("пользователь разблокирован");
        loadUsers();
      } else {
        alert("ошибка разблокировки");
      }
    } else {
      const res = await blockUser(userId);
      if (res.ok) {
        alert("пользователь заблокирован");
        loadUsers();
      } else {
        alert("ошибка блокировки");
      }
    }
  }

  const categories = ["все", "спорт", "чоппер"];

  const filteredProducts =
    category === "все"
      ? products
      : products.filter((p) => p.category === category);

  if (page === "login") {
    return (
      <form onSubmit={handleLogin} className="form">
        <h2>🏍️ вход в мотосалон</h2>
        <input name="email" placeholder="email" required />
        <input name="password" type="password" placeholder="пароль" required />
        <button>войти</button>
        <p onClick={() => setPage("register")}>регистрация</p>
      </form>
    );
  }

  if (page === "register") {
    return (
      <form onSubmit={handleRegister} className="form">
        <h2>🏍️ регистрация</h2>
        <input name="first_name" placeholder="имя" required />
        <input name="last_name" placeholder="фамилия" required />
        <input name="email" placeholder="email" required />
        <input name="password" type="password" placeholder="пароль" required />
        <select name="role" required>
          <option value="user">покупатель</option>
          <option value="seller">продавец</option>
        </select>
        <button>создать аккаунт</button>
        <p onClick={() => setPage("login")}>назад</p>
      </form>
    );
  }

  if (page === "create") {
    return (
      <form onSubmit={handleCreate} className="form">
        <h2>🏍️ добавить мотоцикл</h2>
        <input name="name" placeholder="модель" required />
        <select name="category" required>
          <option value="спорт">спорт</option>
          <option value="чоппер">чоппер</option>
        </select>
        <input name="description" placeholder="описание" required />
        <input name="price" type="number" placeholder="цена (₽)" required />
        <input name="stock" type="number" placeholder="количество" required />
        <input name="engine" placeholder="объем двигателя (см³)" required />
        <input name="year" type="number" placeholder="год выпуска" required />
        <button>добавить</button>
        <p onClick={() => setPage("products")}>назад</p>
      </form>
    );
  }

  if (page === "edit") {
    if (!selectedProduct) {
      return (
        <div className="form">
          <h2>мотоцикл не выбран</h2>
          <p onClick={() => setPage("products")}>назад</p>
        </div>
      );
    }

    return (
      <form onSubmit={handleEdit} className="form">
        <h2>🏍️ редактировать мотоцикл</h2>
        <input name="name" defaultValue={selectedProduct.name} required />
        <select name="category" defaultValue={selectedProduct.category} required>
          <option value="спорт">спорт</option>
          <option value="чоппер">чоппер</option>
        </select>
        <input
          name="description"
          defaultValue={selectedProduct.description}
          required
        />
        <input
          name="price"
          type="number"
          defaultValue={selectedProduct.price}
          required
        />
        <input
          name="stock"
          type="number"
          defaultValue={selectedProduct.stock}
          required
        />
        <input
          name="engine"
          defaultValue={selectedProduct.engine}
          required
        />
        <input
          name="year"
          type="number"
          defaultValue={selectedProduct.year}
          required
        />
        <button>сохранить</button>
        <p onClick={() => setPage("products")}>назад</p>
      </form>
    );
  }

  if (page === "details") {
    if (!selectedProduct) {
      return (
        <div className="details-box">
          <h2>мотоцикл не найден</h2>
          <button onClick={() => setPage("products")}>назад</button>
        </div>
      );
    }

    return (
      <div className="details-box">
        <div className="details-emoji">
          {getEmoji(selectedProduct.category)}
        </div>
        <h2>{selectedProduct.name}</h2>
        <p><b>категория:</b> {selectedProduct.category}</p>
        <p><b>описание:</b> {selectedProduct.description}</p>
        <p><b>цена:</b> {selectedProduct.price} ₽</p>
        <p><b>в наличии:</b> {selectedProduct.stock} шт.</p>
        <p><b>двигатель:</b> {selectedProduct.engine} см³</p>
        <p><b>год выпуска:</b> {selectedProduct.year}</p>

        <div className="details-actions">
          {(user?.role === "seller" || user?.role === "admin") && (
            <button onClick={() => setPage("edit")}>редактировать</button>
          )}
          <button onClick={() => setPage("products")}>назад</button>
        </div>
      </div>
    );
  }

  if (page === "admin-panel") {
    if (usersList.length === 0) {
      loadUsers();
    }

    return (
      <div className="page">
        <div className="header-bar">
          <h1>👑 админ-панель</h1>
          <p>управление пользователями</p>
        </div>

        <div className="top-buttons">
          <button onClick={() => setPage("products")}>вернуться в магазин</button>
          <button onClick={handleLogout}>выйти</button>
        </div>

        {editingUser ? (
          <form onSubmit={handleUpdateUser} className="form">
            <h2>редактировать пользователя: {editingUser.email}</h2>
            <input
              name="first_name"
              defaultValue={editingUser.first_name}
              placeholder="имя"
              required
            />
            <input
              name="last_name"
              defaultValue={editingUser.last_name}
              placeholder="фамилия"
              required
            />
            <select name="role" defaultValue={editingUser.role}>
              <option value="user">покупатель</option>
              <option value="seller">продавец</option>
              <option value="admin">администратор</option>
            </select>
            <button>сохранить</button>
            <p onClick={() => setEditingUser(null)}>отмена</p>
          </form>
        ) : (
          <div>
            {usersList.map((u) => (
              <div key={u.id} className="card">
                <div className="card-body">
                  <h3>{u.first_name} {u.last_name}</h3>
                  <p><b>email:</b> {u.email}</p>
                  <p><b>роль:</b> {u.role === "user" ? "покупатель" : u.role === "seller" ? "продавец" : "администратор"}</p>
                  <p><b>статус:</b> {u.isBlocked ? "🔒 заблокирован" : "✅ активен"}</p>

                  <div className="details-actions">
                    <button onClick={() => setEditingUser(u)}>✏️ редактировать</button>
                    <button onClick={() => handleBlockUser(u.id, u.isBlocked)}>
                      {u.isBlocked ? "🔓 разблокировать" : "🔒 заблокировать"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header-bar">
        <h1>🏍️ мотосалон</h1>
        <p>спорт и чоппер — выбирай своего железного коня</p>
      </div>

      <div className="top-buttons">
        {(user?.role === "seller" || user?.role === "admin") && (
          <button onClick={() => setPage("create")}>➕ добавить мотоцикл</button>
        )}

        {user?.role === "admin" && (
          <button onClick={() => {
            setPage("admin-panel");
            loadUsers();
          }}>👑 админ-панель</button>
        )}

        <button onClick={handleLogout}>🚪 выйти</button>
      </div>

      <div className="filters">
        {["все", "спорт", "чоппер"].map((cat) => (
          <button
            key={cat}
            className={category === cat ? "filter-btn active" : "filter-btn"}
            onClick={() => setCategory(cat)}
          >
            {cat === "все" ? "🏁 все" : cat === "спорт" ? "🏍️ спорт" : "🛵 чоппер"}
          </button>
        ))}
      </div>

      {filteredProducts.map((p) => (
        <div key={p.id} className="card">
          <div className="card-image">{getEmoji(p.category)}</div>

          <div className="card-body">
            <h3>{p.name}</h3>
            <p>{p.description}</p>

            <p><b>цена:</b> {p.price} ₽</p>
            <p><b>в наличии:</b> {p.stock} шт.</p>
            <p><b>двигатель:</b> {p.engine} см³</p>

            <button onClick={() => openDetails(p.id)}>🔍 подробнее</button>

            {(user?.role === "seller" || user?.role === "admin") && (
              <button onClick={() => {
                setSelectedProduct(p);
                setPage("edit");
              }}>
                ✏️ редактировать
              </button>
            )}

            {user?.role === "admin" && (
              <button onClick={() => handleDelete(p.id)}>🗑️ удалить</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function getEmoji(category) {
  if (category === "спорт") return "🏍️";
  if (category === "чоппер") return "🛵";
  return "🏁";
}