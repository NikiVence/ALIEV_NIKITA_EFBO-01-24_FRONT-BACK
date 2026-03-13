const express = require('express');
const app = express();
const port = 3000

app.use(express.json())

let products = [
  { id: 1, name: 'Ноутбук', price: 75000 },
  { id: 2, name: 'Мышь', price: 1500 },
  { id: 3, name: 'Клавиатура', price: 3000 }
];

function getNextId() {
  if (products.length === 0) return 1;
  
  let maxId = 0;
  for (const product of products) {
    if (product.id > maxId) {
      maxId = product.id;
    }
  }
  return maxId + 1;
}

function getAllIds() {
    let ids = []

    for (const product of products) {
        ids.push(product.id)
    }
    return ids
  }



app.get('/', (req, res) => {
  res.json(products);
});

app.post('/create', (req, res) => {
    const { name, price } = req.body;

    if (!name || !price) {
        res.status(401).json("name and price are required")
    }

    if (typeof price != "number" || price < 0) {
        res.status(401).json("not available price")
    }

    const newProduct = {
    id: getNextId(),
    name,
    price
  };
    products.push(newProduct);
    res.status(201).json(newProduct);
});



app.delete("/delete", (req, res) => {
    const {id} = req.body
    console.log(id)
    const productIndex = products.findIndex(p => p.id === id);

    if (typeof id != "number" || id <= 0) {
        res.status(401).json("ошибка в типе данных")
    }

    if (!(id in getAllIds())) {
        res.status(401).json("такого айди не существует")
    }

    products.splice(productIndex, 1);
    res.status(200).json(products);
})

app.patch('/product/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    const { name, price } = req.body;
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    res.json(product);
});

app.listen(port, () => {
console.log(`Сервер запущен на http://localhost:${port}`);
});