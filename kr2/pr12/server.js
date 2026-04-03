const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const ACCESS_SECRET = "my_access_secret_key";
const REFRESH_SECRET = "my_refresh_secret_key";


let users = [
];

async function initAdmin() {
  const adminExists = users.find(u => u.role === "admin");
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUser = {
      id: Date.now(),
      email: "admin@example.com",
      first_name: "Админ",
      last_name: "Системы",
      password: hashedPassword,
      role: "admin",
      isBlocked: false,
    };
    users.push(adminUser);
    console.log("✅ Администратор создан: admin@example.com / admin123");
  }
}

let refreshTokens = [];

let products = [
  { id: 1, name: "Yamaha R6", category: "спорт", description: "Спортбайк с 600-кубовым двигателем и агрессивным дизайном.", price: 850000, stock: 3, engine: 600, year: 2022 },
  { id: 2, name: "Harley-Davidson Iron 883", category: "чоппер", description: "Классический чоппер с характерным звуком V-твина.", price: 1450000, stock: 2, engine: 883, year: 2021 },
  { id: 3, name: "Kawasaki Ninja 400", category: "спорт", description: "Лёгкий и манёвренный спортбайк для города и трассы.", price: 550000, stock: 5, engine: 399, year: 2023 },
  { id: 4, name: "Honda Rebel 500", category: "чоппер", description: "Чоппер в современном стиле, идеален для новичков.", price: 680000, stock: 4, engine: 471, year: 2022 },
  { id: 5, name: "Suzuki GSX-R1000", category: "спорт", description: "Флагманский спортбайк с литровым двигателем.", price: 1850000, stock: 1, engine: 1000, year: 2023 },
];

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function generateAccessToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Online Store API",
      version: "1.2.0",
      description: "API интернет-магазина с access и refresh токенами и ролевой системой",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1711111111111 },
            email: { type: "string", example: "ivan@example.com" },
            first_name: { type: "string", example: "Иван" },
            last_name: { type: "string", example: "Иванов" },
            role: { type: "string", enum: ["user", "seller", "admin"], example: "user" },
            isBlocked: { type: "boolean", example: false },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["email", "first_name", "last_name", "password", "role"],
          properties: {
            email: { type: "string", example: "ivan@example.com" },
            first_name: { type: "string", example: "Иван" },
            last_name: { type: "string", example: "Иванов" },
            password: { type: "string", example: "123456" },
            role: { type: "string", enum: ["user", "seller"], example: "user" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "ivan@example.com" },
            password: { type: "string", example: "123456" },
          },
        },
        TokenPair: {
          type: "object",
          properties: {
            accessToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access",
            },
            refreshToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh",
            },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Nike Air Max" },
            category: { type: "string", example: "Кроссовки" },
            description: { type: "string", example: "Удобные кроссовки для бега и повседневной носки." },
            price: { type: "integer", example: 12000 },
            stock: { type: "integer", example: 5 },
          },
        },
        ProductInput: {
          type: "object",
          required: ["name", "category", "description", "price", "stock"],
          properties: {
            name: { type: "string", example: "Asics Gel Lyte" },
            category: { type: "string", example: "Кроссовки" },
            description: { type: "string", example: "Лёгкие и удобные кроссовки." },
            price: { type: "integer", example: 9900 },
            stock: { type: "integer", example: 10 },
          },
        },
        UpdateUserRequest: {
          type: "object",
          properties: {
            first_name: { type: "string", example: "Петр" },
            last_name: { type: "string", example: "Петров" },
            role: { type: "string", enum: ["user", "seller", "admin"], example: "seller" },
            isBlocked: { type: "boolean", example: false },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "Ошибка" },
          },
        },
        MessageResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Удалено" },
          },
        },
      },
    },
  },
  apis: ["./server.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

// ── Middleware ────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Нет токена" });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, ACCESS_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Токен недействителен" });
  }
}

function roleMiddleware(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Нет доступа" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Недостаточно прав" });
    }

    next();
  };
}

// ── AUTH ───

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Пользователь уже существует или неверная роль
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password, role } = req.body;

  const allowedRoles = ["user", "seller"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: "Допустимые роли: user, seller" });
  }

  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: "Пользователь уже существует" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    id: Date.now(),
    email,
    first_name,
    last_name,
    password: hashedPassword,
    role: role,
    isBlocked: false,
  };

  users.push(user);

  res.status(201).json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    isBlocked: user.isBlocked,
  });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Успешный вход, возвращает access и refresh токены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenPair'
 *       401:
 *         description: Неверный email или пароль
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ error: "Ошибка" });

  if (user.isBlocked) {
    return res.status(403).json({ error: "Пользователь заблокирован" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: "Ошибка" });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  refreshTokens.push(refreshToken);

  res.json({ accessToken, refreshToken });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить пару токенов по refresh-токену
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-refresh-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Refresh token
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenPair'
 *       401:
 *         description: Refresh token отсутствует или недействителен
 */
app.post("/api/auth/refresh", (req, res) => {
  const refreshToken = req.headers["x-refresh-token"];

  if (!refreshToken) {
    return res.status(401).json({ error: "Нет refresh-токена" });
  }

  if (!refreshTokens.includes(refreshToken)) {
    return res.status(401).json({ error: "Refresh-токен не найден" });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);

    const user = users.find((u) => u.id === payload.id);
    if (!user) {
      return res.status(401).json({ error: "Пользователь не найден" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: "Пользователь заблокирован" });
    }

    refreshTokens = refreshTokens.filter((t) => t !== refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    refreshTokens.push(newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch {
    return res.status(401).json({ error: "Refresh-токен недействителен" });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные текущего пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Нет токена или токен недействителен
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    isBlocked: user.isBlocked,
  });
});

// ── PRODUCTS ──────────────────────────────────────────────

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список товаров
 */
app.get(
  "/api/products",
  authMiddleware,
  roleMiddleware("user", "seller", "admin"),
  (req, res) => {
    res.json(products);
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Данные товара
 *       404:
 *         description: Товар не найден
 */
app.get(
  "/api/products/:id",
  authMiddleware,
  roleMiddleware("user", "seller", "admin"),
  (req, res) => {
    const product = products.find((p) => p.id == req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    res.json(product);
  }
);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Товар создан
 */
app.post(
  "/api/products",
  authMiddleware,
  roleMiddleware("seller", "admin"),
  (req, res) => {
    const newProduct = { id: Date.now(), ...req.body };
    products.push(newProduct);
    res.status(201).json(newProduct);
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Товар обновлен
 *       404:
 *         description: Товар не найден
 */
app.put(
  "/api/products/:id",
  authMiddleware,
  roleMiddleware("seller", "admin"),
  (req, res) => {
    const product = products.find((p) => p.id == req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    Object.assign(product, req.body);
    res.json(product);
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Товар удален
 *       404:
 *         description: Товар не найден
 */
app.delete(
  "/api/products/:id",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    const product = products.find((p) => p.id == req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    products = products.filter((p) => p.id != req.params.id);
    res.json({ message: "Удалено" });
  }
);

// ── USERS (Admin only) ───────────────────────────────────

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список всех пользователей (только для админа)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 */
app.get(
  "/api/users",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    const safeUsers = users.map(({ password, ...rest }) => rest);
    res.json(safeUsers);
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID (только для админа)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Данные пользователя
 *       404:
 *         description: Пользователь не найден
 */
app.get(
  "/api/users/:id",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    const user = users.find((u) => u.id == req.params.id);

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const { password, ...safeUser } = user;
    res.json(safeUser);
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить данные пользователя (только для админа)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: Пользователь обновлен
 *       404:
 *         description: Пользователь не найден
 */
app.put(
  "/api/users/:id",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    const user = users.find((u) => u.id == req.params.id);

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const { first_name, last_name, role, isBlocked } = req.body;

    if (first_name !== undefined) user.first_name = first_name;
    if (last_name !== undefined) user.last_name = last_name;
    if (role !== undefined) user.role = role;
    if (isBlocked !== undefined) user.isBlocked = isBlocked;

    const { password, ...safeUser } = user;
    res.json(safeUser);
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать пользователя (только для админа)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Пользователь заблокирован
 *       404:
 *         description: Пользователь не найден
 */
app.delete(
  "/api/users/:id",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    const user = users.find((u) => u.id == req.params.id);

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    user.isBlocked = true;

    res.json({ message: "Пользователь заблокирован" });
  }
);

/**
 * @swagger
 * /api/users/{id}/unblock:
 *   post:
 *     summary: Разблокировать пользователя (только для админа)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Пользователь разблокирован
 *       404:
 *         description: Пользователь не найден
 */
app.post(
  "/api/users/:id/unblock",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    const user = users.find((u) => u.id == req.params.id);

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    user.isBlocked = false;

    res.json({ message: "Пользователь разблокирован" });
  }
);

initAdmin()
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}/api-docs`);
});