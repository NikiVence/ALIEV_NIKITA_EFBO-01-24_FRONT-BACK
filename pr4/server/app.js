const express = require('express');
const { nanoid } = require('nanoid');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

const cors = require("cors");
app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// Middleware для парсинга JSON
app.use(express.json());

// Middleware для логирования запросов
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});

let products = [
    { 
        id: nanoid(6), 
        name: 'Testosterone Enanthate', 
        category: 'Инъекции', 
        description: 'Классический тестостерон для массы и силы. 250mg/ml, 10ml',
        price: 2500, 
        stock: 15,
        rating: 4.9
    },
    {
        id: nanoid(6),
        name: 'Deca-Durabolin',
        category: 'Инъекции',
        description: 'Нандролон деканоат. Для суставов и массы. 300mg/ml, 10ml',
        price: 2900,
        stock: 11,
        rating: 4.7
    },
    {
        id: nanoid(6),
        name: 'HGH Somatropin',
        category: 'Гормон роста',
        description: 'Гормон роста человека. 10 ампул по 10 IU',
        price: 8500,
        stock: 4,
        rating: 5.0
    }
];

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '💊 Фарма-магазин API',
            version: '1.0.0',
            description: 'API для управления товарами фармацевтического магазина',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер',
            },
        ],
    },
    apis: ['./app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Функция-помощник для поиска товара
function findProductOr404(id, res) {
    const product = products.find(p => p.id == id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный ID товара
 *           example: "abc123"
 *         name:
 *           type: string
 *           description: Название товара
 *           example: "Testosterone Enanthate"
 *         category:
 *           type: string
 *           description: Категория товара
 *           enum: [Инъекции, Гормон роста, Таблетки, Пептиды]
 *           example: "Инъекции"
 *         description:
 *           type: string
 *           description: Описание товара
 *           example: "Классический тестостерон для массы и силы. 250mg/ml, 10ml"
 *         price:
 *           type: number
 *           format: float
 *           description: Цена товара в рублях
 *           example: 2500
 *         stock:
 *           type: integer
 *           description: Количество на складе
 *           example: 15
 *         rating:
 *           type: number
 *           format: float
 *           description: Рейтинг товара
 *           example: 4.9
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Описание ошибки
 *           example: "Product not found"
 *   tags:
 *     - name: Products
 *       description: Управление товарами
 *     - name: Categories
 *       description: Работа с категориями
 *     - name: Search
 *       description: Поиск товаров
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить все товары
 *     description: Возвращает список всех доступных товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Успешный запрос
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     description: Возвращает информацию о конкретном товаре
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *         example: "abc123"
 *     responses:
 *       200:
 *         description: Информация о товаре
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    res.json(product);
});

/**
 * @swagger
 * /api/products/category/{category}:
 *   get:
 *     summary: Получить товары по категории
 *     description: Возвращает товары, отфильтрованные по категории
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Инъекции, Гормон роста, Таблетки, Пептиды]
 *         description: Название категории
 *         example: "Инъекции"
 *     responses:
 *       200:
 *         description: Список товаров в категории
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products/category/:category", (req, res) => {
    const category = req.params.category;
    const filtered = products.filter(p => 
        p.category.toLowerCase() === category.toLowerCase()
    );
    res.json(filtered);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     description: Добавляет новый товар в каталог
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название товара
 *                 example: "Trenbolone Acetate"
 *               category:
 *                 type: string
 *                 description: Категория товара
 *                 enum: [Инъекции, Гормон роста, Таблетки, Пептиды]
 *                 example: "Инъекции"
 *               description:
 *                 type: string
 *                 description: Описание товара
 *                 example: "Мощный анаболик для сушки. 100mg/ml, 10ml"
 *               price:
 *                 type: number
 *                 description: Цена в рублях
 *                 example: 3500
 *               stock:
 *                 type: integer
 *                 description: Количество на складе
 *                 example: 8
 *               rating:
 *                 type: number
 *                 description: Рейтинг товара (опционально)
 *                 example: 4.8
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка в данных запроса
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Name, category, price and stock are required"
 */
app.post("/api/products", (req, res) => {
    const { name, category, description, price, stock, rating } = req.body;
    
    if (!name || !category || !price || stock === undefined) {
        return res.status(400).json({ error: "Name, category, price and stock are required" });
    }

    const newProduct = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description?.trim() || "",
        price: Number(price),
        stock: Number(stock),
        rating: rating ? Number(rating) : 0
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновить товар
 *     description: Частичное обновление информации о товаре
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *         example: "abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Testosterone Enanthate 300mg"
 *               category:
 *                 type: string
 *                 enum: [Инъекции, Гормон роста, Таблетки, Пептиды]
 *                 example: "Инъекции"
 *               description:
 *                 type: string
 *                 example: "Усиленная формула 300mg/ml"
 *               price:
 *                 type: number
 *                 example: 2800
 *               stock:
 *                 type: integer
 *                 example: 12
 *               rating:
 *                 type: number
 *                 example: 5.0
 *     responses:
 *       200:
 *         description: Товар успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.patch("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "Nothing to update" });
    }

    const { name, category, description, price, stock, rating } = req.body;

    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (rating !== undefined) product.rating = Number(rating);

    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     description: Удаляет товар из каталога
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *         example: "abc123"
 *     responses:
 *       204:
 *         description: Товар успешно удален (нет тела ответа)
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.delete("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const exists = products.some(p => p.id === id);
    
    if (!exists) {
        return res.status(404).json({ error: "Product not found" });
    }
    
    products = products.filter(p => p.id !== id);
    res.status(204).send();
});

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Поиск товаров
 *     description: Ищет товары по названию и описанию
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Поисковый запрос
 *         example: "testosterone"
 *     responses:
 *       200:
 *         description: Результаты поиска
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/search", (req, res) => {
    const query = req.query.q?.toLowerCase() || "";
    if (!query) {
        return res.json([]);
    }
    
    const results = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
    );
    res.json(results);
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Проверка работоспособности API
 *     description: Проверяет, что API работает и возвращает статистику
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API работает
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 productsCount:
 *                   type: integer
 *                   example: 3
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T12:00:00.000Z"
 */
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        productsCount: products.length,
        timestamp: new Date().toISOString()
    });
});

// 404 для всех остальных маршрутов
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`💊 Фарма-магазин запущен на http://localhost:${port}`);
    console.log(`📦 Доступно товаров: ${products.length}`);
    console.log(`📚 Swagger документация: http://localhost:${port}/api-docs`);
});