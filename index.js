require("dotenv").config();

const express = require("express");
const pool = require("./db");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Permette al server di leggere richieste in formato JSON
app.use(express.json());

// Rotta principale di controllo
app.get("/", (req, res) => {
  res.json({
    message: "API Orizon attiva"
  });
});
// Recupera tutti i prodotti
app.get("/api/products", async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT id, name, created_at, updated_at
       FROM products
       ORDER BY id ASC`
    );

    res.status(200).json(products);
  } catch (error) {
    console.error("Errore nel recupero dei prodotti:", error.message);

    res.status(500).json({
      error: "Errore interno del server"
    });
  }
});
// Recupera un singolo prodotto tramite ID
app.get("/api/products/:id", async (req, res) => {
  const productId = Number(req.params.id);

  // Controlla che l'ID sia un numero intero positivo
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({
      error: "ID del prodotto non valido"
    });
  }

  try {
    const [products] = await pool.execute(
      `SELECT id, name, created_at, updated_at
       FROM products
       WHERE id = ?`,
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        error: "Prodotto non trovato"
      });
    }

    res.status(200).json(products[0]);
  } catch (error) {
    console.error("Errore nel recupero del prodotto:", error.message);

    res.status(500).json({
      error: "Errore interno del server"
    });
  }
});
// Inserisce un nuovo prodotto
app.post("/api/products", async (req, res) => {
  const { name } = req.body;

  // Controlla che il nome sia presente e sia una stringa
  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({
      error: "Il nome del prodotto è obbligatorio"
    });
  }

  const cleanName = name.trim();

  // Il database accetta nomi lunghi al massimo 150 caratteri
  if (cleanName.length > 150) {
    return res.status(400).json({
      error: "Il nome non può superare 150 caratteri"
    });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO products (name) VALUES (?)",
      [cleanName]
    );

    const [products] = await pool.execute(
      `SELECT id, name, created_at, updated_at
       FROM products
       WHERE id = ?`,
      [result.insertId]
    );

    res
      .status(201)
      .location(`/api/products/${result.insertId}`)
      .json(products[0]);
  } catch (error) {
    console.error("Errore nell'inserimento del prodotto:", error.message);

    res.status(500).json({
      error: "Errore interno del server"
    });
  }
});

// Modifica un prodotto tramite ID
app.put("/api/products/:id", async (req, res) => {
  const productId = Number(req.params.id);
  const { name } = req.body;

  // Controlla che l'ID sia un numero intero positivo
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({
      error: "ID del prodotto non valido"
    });
  }

  // Controlla che il nome sia presente
  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({
      error: "Il nome del prodotto è obbligatorio"
    });
  }

  const cleanName = name.trim();

  if (cleanName.length > 150) {
    return res.status(400).json({
      error: "Il nome non può superare 150 caratteri"
    });
  }

  try {
    const [result] = await pool.execute(
      "UPDATE products SET name = ? WHERE id = ?",
      [cleanName, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Prodotto non trovato"
      });
    }

    const [products] = await pool.execute(
      `SELECT id, name, created_at, updated_at
       FROM products
       WHERE id = ?`,
      [productId]
    );

    res.status(200).json(products[0]);
  } catch (error) {
    console.error("Errore nella modifica del prodotto:", error.message);

    res.status(500).json({
      error: "Errore interno del server"
    });
  }
});

// Cancella un prodotto tramite ID
app.delete("/api/products/:id", async (req, res) => {
  const productId = Number(req.params.id);

  // Controlla che l'ID sia un numero intero positivo
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({
      error: "ID del prodotto non valido"
    });
  }

  try {
    const [result] = await pool.execute(
      "DELETE FROM products WHERE id = ?",
      [productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Prodotto non trovato"
      });
    }

    // La cancellazione è riuscita e non restituiamo contenuto
    res.status(204).send();
  } catch (error) {
    console.error("Errore nella cancellazione del prodotto:", error.message);

    res.status(500).json({
      error: "Errore interno del server"
    });
  }
});

// Recupera tutti gli utenti
app.get("/api/users", async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, first_name, last_name, email, created_at, updated_at
       FROM users
       ORDER BY id ASC`
    );

    res.status(200).json(users);
  } catch (error) {
    console.error("Errore nel recupero degli utenti:", error.message);

    res.status(500).json({
      error: "Errore interno del server"
    });
  }
});

// Recupera un singolo utente tramite ID
app.get("/api/users/:id", async (req, res) => {
  const userId = Number(req.params.id);

  // Controlla che l'ID sia un numero intero positivo
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      error: "ID dell'utente non valido"
    });
  }

  try {
    const [users] = await pool.execute(
      `SELECT id, first_name, last_name, email, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: "Utente non trovato"
      });
    }

    res.status(200).json(users[0]);
  } catch (error) {
    console.error("Errore nel recupero dell'utente:", error.message);

    res.status(500).json({
      error: "Errore interno del server"
    });
  }
});

// Inserisce un nuovo utente
app.post("/api/users", async (req, res) => {
  const { first_name, last_name, email } = req.body;

  // Controlla che il nome sia valido
  if (typeof first_name !== "string" || first_name.trim() === "") {
    return res.status(400).json({
      error: "Il nome è obbligatorio"
    });
  }

  // Controlla che il cognome sia valido
  if (typeof last_name !== "string" || last_name.trim() === "") {
    return res.status(400).json({
      error: "Il cognome è obbligatorio"
    });
  }

  // Controlla che l'email sia presente
  if (typeof email !== "string" || email.trim() === "") {
    return res.status(400).json({
      error: "L'email è obbligatoria"
    });
  }

  const cleanFirstName = first_name.trim();
  const cleanLastName = last_name.trim();
  const cleanEmail = email.trim().toLowerCase();

  // Controlla la lunghezza dei dati
  if (cleanFirstName.length > 100) {
    return res.status(400).json({
      error: "Il nome non può superare 100 caratteri"
    });
  }

  if (cleanLastName.length > 100) {
    return res.status(400).json({
      error: "Il cognome non può superare 100 caratteri"
    });
  }

  if (cleanEmail.length > 255) {
    return res.status(400).json({
      error: "L'email non può superare 255 caratteri"
    });
  }

  // Controllo semplice del formato email
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(cleanEmail)) {
    return res.status(400).json({
      error: "Formato email non valido"
    });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO users (first_name, last_name, email)
       VALUES (?, ?, ?)`,
      [cleanFirstName, cleanLastName, cleanEmail]
    );

    const [users] = await pool.execute(
      `SELECT id, first_name, last_name, email, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [result.insertId]
    );

    res
      .status(201)
      .location(`/api/users/${result.insertId}`)
      .json(users[0]);
  } catch (error) {
    // L'email è già presente nel database
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Esiste già un utente con questa email"
      });
    }

    console.error("Errore nell'inserimento dell'utente:", error.message);

    res.status(500).json({
      error: "Errore interno del server"
    });
  }
});

// Modifica un utente tramite ID
app.put("/api/users/:id", async (req, res) => {
  const userId = Number(req.params.id);
  const { first_name, last_name, email } = req.body;

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      error: "ID dell'utente non valido"
    });
  }

  if (typeof first_name !== "string" || first_name.trim() === "") {
    return res.status(400).json({
      error: "Il nome è obbligatorio"
    });
  }

  if (typeof last_name !== "string" || last_name.trim() === "") {
    return res.status(400).json({
      error: "Il cognome è obbligatorio"
    });
  }

  if (typeof email !== "string" || email.trim() === "") {
    return res.status(400).json({
      error: "L'email è obbligatoria"
    });
  }

  const cleanFirstName = first_name.trim();
  const cleanLastName = last_name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (cleanFirstName.length > 100) {
    return res.status(400).json({
      error: "Il nome non può superare 100 caratteri"
    });
  }

  if (cleanLastName.length > 100) {
    return res.status(400).json({
      error: "Il cognome non può superare 100 caratteri"
    });
  }

  if (cleanEmail.length > 255) {
    return res.status(400).json({
      error: "L'email non può superare 255 caratteri"
    });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(cleanEmail)) {
    return res.status(400).json({
      error: "Formato email non valido"
    });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE users
       SET first_name = ?, last_name = ?, email = ?
       WHERE id = ?`,
      [cleanFirstName, cleanLastName, cleanEmail, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Utente non trovato"
      });
    }

    const [users] = await pool.execute(
      `SELECT id, first_name, last_name, email, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    res.status(200).json(users[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Esiste già un utente con questa email"
      });
    }

    console.error("Errore nella modifica dell'utente:", error.message);

    res.status(500).json({
      error: "Errore interno del server"
    });
  }
});

// Cancella un utente tramite ID
app.delete("/api/users/:id", async (req, res) => {
  const userId = Number(req.params.id);

  // Controlla che l'ID sia un numero intero positivo
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      error: "ID dell'utente non valido"
    });
  }

  try {
    const [result] = await pool.execute(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Utente non trovato"
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Errore nella cancellazione dell'utente:", error.message);

    res.status(500).json({
      error: "Errore interno del server"
    });
  }
});

// Recupera tutti gli ordini, eventualmente filtrati
async function getAllOrdersWithDetails({ productId, date } = {}) {
  let query = `
    SELECT
      o.id,
      o.created_at,
      o.updated_at
    FROM orders AS o
  `;

  const conditions = [];
  const queryValues = [];

  // Filtra gli ordini che contengono un determinato prodotto
  if (productId) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM order_products AS op_filter
        WHERE op_filter.order_id = o.id
          AND op_filter.product_id = ?
      )
    `);

    queryValues.push(productId);
  }

  // Filtra gli ordini creati nella data indicata
  if (date) {
    conditions.push(`
      o.created_at >= ?
      AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
    `);

    const startOfDay = `${date} 00:00:00`;

    queryValues.push(startOfDay, startOfDay);
  }

  // Aggiunge WHERE soltanto quando esiste almeno un filtro
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += " ORDER BY o.id ASC";

  const [orders] = await pool.execute(query, queryValues);

  for (const order of orders) {
    const [products] = await pool.execute(
      `SELECT
         p.id,
         p.name,
         op.quantity
       FROM order_products AS op
       INNER JOIN products AS p
         ON p.id = op.product_id
       WHERE op.order_id = ?
       ORDER BY p.id ASC`,
      [order.id]
    );

    const [users] = await pool.execute(
      `SELECT
         u.id,
         u.first_name,
         u.last_name,
         u.email
       FROM order_users AS ou
       INNER JOIN users AS u
         ON u.id = ou.user_id
       WHERE ou.order_id = ?
       ORDER BY u.id ASC`,
      [order.id]
    );

    order.products = products;
    order.users = users;
  }

  return orders;
}

// Recupera gli ordini, con filtri facoltativi
app.get("/api/orders", async (req, res) => {
  const { product_id, date } = req.query;

  let productId;

  // Controlla il filtro per prodotto
  if (product_id !== undefined) {
    productId = Number(product_id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        error: "ID del prodotto non valido"
      });
    }
  }

  // Controlla il formato della data: YYYY-MM-DD
  if (date !== undefined) {
    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return res.status(400).json({
        error: "La data deve essere nel formato YYYY-MM-DD"
      });
    }

    const [year, month, day] = date.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    const isValidDate =
      parsedDate.getUTCFullYear() === year &&
      parsedDate.getUTCMonth() === month - 1 &&
      parsedDate.getUTCDate() === day;

    if (!isValidDate) {
      return res.status(400).json({
        error: "Data non valida"
      });
    }
  }

  try {
    const orders = await getAllOrdersWithDetails({
      productId,
      date
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error(
      "Errore nel recupero degli ordini:",
      error.message
    );

    res.status(500).json({
      error: "Errore interno del server"
    });
  }
});

// Recupera un singolo ordine con prodotti e utenti collegati
async function getOrderByIdWithDetails(orderId) {
  const [orders] = await pool.execute(
    `SELECT id, created_at, updated_at
     FROM orders
     WHERE id = ?`,
    [orderId]
  );

  if (orders.length === 0) {
    return null;
  }

  const order = orders[0];

  const [products] = await pool.execute(
    `SELECT
       p.id,
       p.name,
       op.quantity
     FROM order_products AS op
     INNER JOIN products AS p
       ON p.id = op.product_id
     WHERE op.order_id = ?
     ORDER BY p.id ASC`,
    [orderId]
  );

  const [users] = await pool.execute(
    `SELECT
       u.id,
       u.first_name,
       u.last_name,
       u.email
     FROM order_users AS ou
     INNER JOIN users AS u
       ON u.id = ou.user_id
     WHERE ou.order_id = ?
     ORDER BY u.id ASC`,
    [orderId]
  );

  order.products = products;
  order.users = users;

  return order;
}

// Recupera un singolo ordine tramite ID
app.get("/api/orders/:id", async (req, res) => {
  const orderId = Number(req.params.id);

  // Controlla che l'ID sia un numero intero positivo
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      error: "ID dell'ordine non valido"
    });
  }

  try {
    const order = await getOrderByIdWithDetails(orderId);

    if (!order) {
      return res.status(404).json({
        error: "Ordine non trovato"
      });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Errore nel recupero dell'ordine:", error.message);

    res.status(500).json({
      error: "Errore interno del server"
    });
  }
});

// Inserisce un nuovo ordine
app.post("/api/orders", async (req, res) => {
  const { products, user_ids } = req.body;

  // Deve essere presente almeno un prodotto
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      error: "L'ordine deve contenere almeno un prodotto"
    });
  }

  // Deve essere presente almeno un utente
  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({
      error: "L'ordine deve contenere almeno un utente"
    });
  }

  const cleanProducts = products.map((product) => ({
    product_id: Number(product.product_id),
    quantity: Number(product.quantity ?? 1)
  }));

  const cleanUserIds = user_ids.map((userId) => Number(userId));

  // Controlla gli ID e le quantità dei prodotti
  const invalidProduct = cleanProducts.some(
    (product) =>
      !Number.isInteger(product.product_id) ||
      product.product_id <= 0 ||
      !Number.isInteger(product.quantity) ||
      product.quantity <= 0
  );

  if (invalidProduct) {
    return res.status(400).json({
      error: "Prodotti o quantità non validi"
    });
  }

  // Non consente lo stesso prodotto due volte nello stesso ordine
  const productIds = cleanProducts.map((product) => product.product_id);
  const uniqueProductIds = new Set(productIds);

  if (uniqueProductIds.size !== productIds.length) {
    return res.status(400).json({
      error: "Lo stesso prodotto non può essere ripetuto nell'ordine"
    });
  }

  // Controlla gli ID degli utenti
  const invalidUserId = cleanUserIds.some(
    (userId) => !Number.isInteger(userId) || userId <= 0
  );

  if (invalidUserId) {
    return res.status(400).json({
      error: "Uno o più ID utente non sono validi"
    });
  }

  // Non consente lo stesso utente due volte
  const uniqueUserIds = [...new Set(cleanUserIds)];

  let connection;

  try {
    connection = await pool.getConnection();

    // Tutte le operazioni devono riuscire insieme
    await connection.beginTransaction();

    // Controlla che tutti i prodotti esistano
    const productPlaceholders = productIds.map(() => "?").join(", ");

    const [existingProducts] = await connection.execute(
      `SELECT id
       FROM products
       WHERE id IN (${productPlaceholders})`,
      productIds
    );

    if (existingProducts.length !== productIds.length) {
      await connection.rollback();

      return res.status(404).json({
        error: "Uno o più prodotti non esistono"
      });
    }

    // Controlla che tutti gli utenti esistano
    const userPlaceholders = uniqueUserIds.map(() => "?").join(", ");

    const [existingUsers] = await connection.execute(
      `SELECT id
       FROM users
       WHERE id IN (${userPlaceholders})`,
      uniqueUserIds
    );

    if (existingUsers.length !== uniqueUserIds.length) {
      await connection.rollback();

      return res.status(404).json({
        error: "Uno o più utenti non esistono"
      });
    }

    // Crea l'ordine
    const [orderResult] = await connection.execute(
      "INSERT INTO orders () VALUES ()"
    );

    const orderId = orderResult.insertId;

    // Collega i prodotti all'ordine
    for (const product of cleanProducts) {
      await connection.execute(
        `INSERT INTO order_products
         (order_id, product_id, quantity)
         VALUES (?, ?, ?)`,
        [orderId, product.product_id, product.quantity]
      );
    }

    // Collega gli utenti all'ordine
    for (const userId of uniqueUserIds) {
      await connection.execute(
        `INSERT INTO order_users
         (order_id, user_id)
         VALUES (?, ?)`,
        [orderId, userId]
      );
    }

    await connection.commit();

    const createdOrder = await getOrderByIdWithDetails(orderId);

    res
      .status(201)
      .location(`/api/orders/${orderId}`)
      .json(createdOrder);
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Errore nella creazione dell'ordine:", error.message);

    res.status(500).json({
      error: "Errore interno del server"
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Modifica un ordine tramite ID
app.put("/api/orders/:id", async (req, res) => {
  const orderId = Number(req.params.id);
  const { products, user_ids } = req.body;

  // Controlla che l'ID dell'ordine sia valido
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      error: "ID dell'ordine non valido"
    });
  }

  // Deve essere presente almeno un prodotto
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      error: "L'ordine deve contenere almeno un prodotto"
    });
  }

  // Deve essere presente almeno un utente
  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({
      error: "L'ordine deve contenere almeno un utente"
    });
  }

  const cleanProducts = products.map((product) => ({
    product_id: Number(product.product_id),
    quantity: Number(product.quantity ?? 1)
  }));

  const cleanUserIds = user_ids.map((userId) => Number(userId));

  // Controlla gli ID e le quantità dei prodotti
  const invalidProduct = cleanProducts.some(
    (product) =>
      !Number.isInteger(product.product_id) ||
      product.product_id <= 0 ||
      !Number.isInteger(product.quantity) ||
      product.quantity <= 0
  );

  if (invalidProduct) {
    return res.status(400).json({
      error: "Prodotti o quantità non validi"
    });
  }

  // Non consente prodotti duplicati
  const productIds = cleanProducts.map(
    (product) => product.product_id
  );

  const uniqueProductIds = new Set(productIds);

  if (uniqueProductIds.size !== productIds.length) {
    return res.status(400).json({
      error: "Lo stesso prodotto non può essere ripetuto nell'ordine"
    });
  }

  // Controlla gli ID degli utenti
  const invalidUserId = cleanUserIds.some(
    (userId) => !Number.isInteger(userId) || userId <= 0
  );

  if (invalidUserId) {
    return res.status(400).json({
      error: "Uno o più ID utente non sono validi"
    });
  }

  // Elimina eventuali utenti duplicati
  const uniqueUserIds = [...new Set(cleanUserIds)];

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Controlla che l'ordine esista
    const [existingOrders] = await connection.execute(
      `SELECT id
       FROM orders
       WHERE id = ?
       FOR UPDATE`,
      [orderId]
    );

    if (existingOrders.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        error: "Ordine non trovato"
      });
    }

    // Controlla che tutti i prodotti esistano
    const productPlaceholders = productIds
      .map(() => "?")
      .join(", ");

    const [existingProducts] = await connection.execute(
      `SELECT id
       FROM products
       WHERE id IN (${productPlaceholders})`,
      productIds
    );

    if (existingProducts.length !== productIds.length) {
      await connection.rollback();

      return res.status(404).json({
        error: "Uno o più prodotti non esistono"
      });
    }

    // Controlla che tutti gli utenti esistano
    const userPlaceholders = uniqueUserIds
      .map(() => "?")
      .join(", ");

    const [existingUsers] = await connection.execute(
      `SELECT id
       FROM users
       WHERE id IN (${userPlaceholders})`,
      uniqueUserIds
    );

    if (existingUsers.length !== uniqueUserIds.length) {
      await connection.rollback();

      return res.status(404).json({
        error: "Uno o più utenti non esistono"
      });
    }

    // Elimina i vecchi collegamenti dell'ordine
    await connection.execute(
      "DELETE FROM order_products WHERE order_id = ?",
      [orderId]
    );

    await connection.execute(
      "DELETE FROM order_users WHERE order_id = ?",
      [orderId]
    );

    // Inserisce i nuovi prodotti
    for (const product of cleanProducts) {
      await connection.execute(
        `INSERT INTO order_products
         (order_id, product_id, quantity)
         VALUES (?, ?, ?)`,
        [orderId, product.product_id, product.quantity]
      );
    }

    // Inserisce i nuovi utenti
    for (const userId of uniqueUserIds) {
      await connection.execute(
        `INSERT INTO order_users
         (order_id, user_id)
         VALUES (?, ?)`,
        [orderId, userId]
      );
    }

    // Aggiorna la data di modifica dell'ordine
    await connection.execute(
      `UPDATE orders
       SET updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [orderId]
    );

    await connection.commit();

    const updatedOrder = await getOrderByIdWithDetails(orderId);

    res.status(200).json(updatedOrder);
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Errore nella modifica dell'ordine:",
      error.message
    );

    res.status(500).json({
      error: "Errore interno del server"
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Cancella un ordine tramite ID
app.delete("/api/orders/:id", async (req, res) => {
  const orderId = Number(req.params.id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      error: "ID dell'ordine non valido"
    });
  }

  try {
    const [result] = await pool.execute(
      "DELETE FROM orders WHERE id = ?",
      [orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Ordine non trovato"
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error(
      "Errore nella cancellazione dell'ordine:",
      error.message
    );

    res.status(500).json({
      error: "Errore interno del server"
    });
  }
});

// Gestisce le rotte che non esistono
app.use((req, res) => {
  res.status(404).json({
    error: "Risorsa non trovata"
  });
});

// Gestisce gli errori non previsti
app.use((error, req, res, next) => {
  console.error("Errore non gestito:", error.message);

  // Gestisce un JSON scritto in modo non valido
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({
      error: "Formato JSON non valido"
    });
  }

  res.status(500).json({
    error: "Errore interno del server"
  });
});

// Avvia il server soltanto se MySQL è raggiungibile
async function startServer() {
  try {
    await pool.query("SELECT 1");

    console.log("Connessione a MySQL riuscita");

    app.listen(PORT, () => {
      console.log(`Server avviato su http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Errore di connessione a MySQL:");
    console.error(error.message);
    process.exit(1);
  }
}

startServer();