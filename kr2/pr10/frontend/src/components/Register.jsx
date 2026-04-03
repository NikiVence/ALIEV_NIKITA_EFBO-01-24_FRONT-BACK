// src/components/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api/client";

function Register({ setUser }) {
    const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "" });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        try {
            await authAPI.register(form);
            
            const loginResponse = await authAPI.login({ email: form.email, password: form.password });
            const { accessToken, refreshToken } = loginResponse.data;
            
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            
            const meResponse = await authAPI.getMe();
            setUser(meResponse.data);
            navigate("/products");
        } catch (err) {
            setError(err.response?.data?.error || "Ошибка регистрации");
        }
    };

    return (
        <div className="form-container">
            <h2>Регистрация</h2>
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
                    type="text"
                    placeholder="Имя"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Фамилия"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    required
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                />
                <button type="submit">Зарегистрироваться</button>
            </form>
            <p>
                Уже есть аккаунт? <a href="/login">Войти</a>
            </p>
        </div>
    );
}

export default Register;