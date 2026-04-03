const express = require('express');
const { nanoid } = require("nanoid");
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

app.use(express.json());

let users = [];
let products = [];

async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

function findUserByEmail(email) {
    return users.find(user => user.email === email);
}

function findProductById(id) {
    return products.find(product => product.id === id);
}

app.post("/api/auth/register", async (req, res) => {
    const { email, password, first_name, last_name } = req.body;

    if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({ error: "Все поля обязательны" });
    }

    if (findUserByEmail(email)) {
        return res.status(409).json({ error: "Пользователь уже существует" });
    }

    const newUser = {
        id: nanoid(),
        email: email,
        first_name: first_name,
        last_name: last_name,
        hashedPassword: await hashPassword(password)
    };

    users.push(newUser);
    
    const { hashedPassword, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: "Email и пароль обязательны" });
    }
    
    const user = findUserByEmail(email);
    if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }
    
    const isValid = await verifyPassword(password, user.hashedPassword);
    
    if (isValid) {
        res.status(200).json({ login: true, message: "Успешный вход" });
    } else {
        res.status(401).json({ error: "Неверный пароль" });
    }
});

app.post("/api/products", (req, res) => {
    const { title, category, description, price } = req.body;
    
    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ error: "Все поля обязательны" });
    }
    
    if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ error: "Цена должна быть положительным числом" });
    }
    
    const newProduct = {
        id: nanoid(),
        title: title,
        category: category,
        description: description,
        price: Number(price)
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.get("/api/products", (req, res) => {
    res.status(200).json(products);
});

app.get("/api/products/:id", (req, res) => {
    const product = findProductById(req.params.id);
    
    if (!product) {
        return res.status(404).json({ error: "Товар не найден" });
    }
    
    res.status(200).json(product);
});

app.put("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const { title, category, description, price } = req.body;
    
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
        return res.status(404).json({ error: "Товар не найден" });
    }
    
    if (price !== undefined && (typeof price !== 'number' || price <= 0)) {
        return res.status(400).json({ error: "Цена должна быть положительным числом" });
    }
    
    const updatedProduct = { ...products[productIndex] };
    if (title) updatedProduct.title = title;
    if (category) updatedProduct.category = category;
    if (description) updatedProduct.description = description;
    if (price !== undefined) updatedProduct.price = Number(price);
    
    products[productIndex] = updatedProduct;
    res.status(200).json(updatedProduct);
});

app.delete("/api/products/:id", (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);
    
    if (productIndex === -1) {
        return res.status(404).json({ error: "Товар не найден" });
    }
    
    products.splice(productIndex, 1);
    res.status(200).json({ message: "Товар удален" });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});