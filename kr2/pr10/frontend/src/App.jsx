// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import ProductList from "./components/ProductList";
import ProductForm from "./components/ProductForm";
import ProductDetail from "./components/ProductDetail";
import { authAPI } from "./api/client";

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            authAPI.getMe()
                .then((res) => setUser(res.data))
                .catch(() => {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
    };

    if (loading) return <div className="container">Загрузка...</div>;

    return (
        <BrowserRouter>
            <nav className="navbar">
                <h1>Магазин</h1>
                <div>
                    {user ? (
                        <>
                            <span>Привет, {user.first_name}!</span>
                            <button onClick={handleLogout}>Выйти</button>
                        </>
                    ) : (
                        <>
                            <a href="/login">Вход</a>
                            <a href="/register">Регистрация</a>
                        </>
                    )}
                </div>
            </nav>
            
            <div className="container">
                <Routes>
                    <Route 
                        path="/login" 
                        element={!user ? <Login setUser={setUser} /> : <Navigate to="/products" />} 
                    />
                    <Route 
                        path="/register" 
                        element={!user ? <Register setUser={setUser} /> : <Navigate to="/products" />} 
                    />
                    <Route 
                        path="/products" 
                        element={user ? <ProductList /> : <Navigate to="/login" />} 
                    />
                    <Route 
                        path="/products/create" 
                        element={user ? <ProductForm /> : <Navigate to="/login" />} 
                    />
                    <Route 
                        path="/products/:id" 
                        element={user ? <ProductDetail /> : <Navigate to="/login" />} 
                    />
                    <Route 
                        path="/products/:id/edit" 
                        element={user ? <ProductForm edit /> : <Navigate to="/login" />} 
                    />
                    <Route path="/" element={<Navigate to="/products" />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;