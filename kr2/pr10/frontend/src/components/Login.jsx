// src/components/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api/client";

function Login({ setUser }) {
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        try {
            const response = await authAPI.login(form);
            const { accessToken, refreshToken } = response.data;
            
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            
            const meResponse = await authAPI.getMe();
            setUser(meResponse.data);
            navigate("/products");
        } catch (err) {
            setError(err.response?.data?.error || "Ошибка входа");
        }
    };

    return (
        <div className="form-container">
            <h2>Вход</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                />
                <button type="submit">Войти</button>
            </form>
            <p>
                Нет аккаунта? <a href="/register">Зарегистрироваться</a>
            </p>
        </div>
    );
}

export default Login;