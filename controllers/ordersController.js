const pool = require("../db");

// Trasforma le righe della JOIN in ordini con prodotti e utenti
function buildOrders(rows) {
  const ordersMap = new Map();

  for (const row of rows) {
    if (!ordersMap.has(row.order_id)) {
      ordersMap.set(row.order_id, {
        id: row.order_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        products: [],
        users: [],
        productIds: new Set(),
        userIds: new Set()
      });
    }

    const order = ordersMap.get(row.order_id);

    if (
      row.product_id !== null &&
      !order.productIds.has(row.product_id)
    ) {
      order.products.push({
        id: row.product_id,
        name: row.product_name,
        quantity: row.quantity
      });

      order.productIds.add(row.product_id);
    }

    if (
      row.user_id !== null &&
      !order.userIds.has(row.user_id)
    ) {
      order.users.push({
        id: row.user_id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email
      });

      order.userIds.add(row.user_id);
    }
  }

  return Array.from(ordersMap.values()).map(
    ({ productIds, userIds, ...order }) => order
  );
}


// Recupera tutti gli ordini, eventualmente filtrati
async function getOrders(req, res) {
  const { product_id, date } = req.query;

  const values = [];
  const conditions = [];

  if (product_id !== undefined) {
    const productId = Number(product_id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        error: "product_id non valido"
      });
    }

    conditions.push(`
      EXISTS (
        SELECT 1
        FROM order_products op_filter
        WHERE op_filter.order_id = o.id
          AND op_filter.product_id = ?
      )
    `);

    values.push(productId);
  }

  if (date !== undefined) {
  // Controlla il formato YYYY-MM-DD
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return res.status(400).json({
      error: "La data deve essere nel formato YYYY-MM-DD"
    });
  }

  // Controlla che la data esista davvero
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

  conditions.push(`
    o.created_at >= ?
    AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
  `);

  values.push(date, date);
}

  let query = `
    SELECT
      o.id AS order_id,
      o.created_at,
      o.updated_at,

      p.id AS product_id,
      p.name AS product_name,
      op.quantity,

      u.id AS user_id,
      u.first_name,
      u.last_name,
      u.email

    FROM orders o

    LEFT JOIN order_products op
      ON op.order_id = o.id

    LEFT JOIN products p
      ON p.id = op.product_id

    LEFT JOIN order_users ou
      ON ou.order_id = o.id

    LEFT JOIN users u
      ON u.id = ou.user_id
  `;

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += `
    ORDER BY o.id ASC, p.id ASC, u.id ASC
  `;

  try {
    const [rows] = await pool.execute(query, values);

    const orders = buildOrders(rows);

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
}

// Recupera un singolo ordine tramite ID
async function getOrderById(req, res) {
  const orderId = Number(req.params.id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      error: "ID dell'ordine non valido"
    });
  }

  try {
    const [rows] = await pool.execute(
      `
      SELECT
        o.id AS order_id,
        o.created_at,
        o.updated_at,

        p.id AS product_id,
        p.name AS product_name,
        op.quantity,

        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.email

      FROM orders o

      LEFT JOIN order_products op
        ON op.order_id = o.id

      LEFT JOIN products p
        ON p.id = op.product_id

      LEFT JOIN order_users ou
        ON ou.order_id = o.id

      LEFT JOIN users u
        ON u.id = ou.user_id

      WHERE o.id = ?

      ORDER BY p.id ASC, u.id ASC
      `,
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Ordine non trovato"
      });
    }

    const orders = buildOrders(rows);

    res.status(200).json(orders[0]);

  } catch (error) {
    console.error(
      "Errore nel recupero dell'ordine:",
      error.message
    );

    res.status(500).json({
      error: "Errore interno del server"
    });
  }
}

// Crea un nuovo ordine
async function createOrder(req, res) {
  const { products, user_ids } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      error: "Devi specificare almeno un prodotto"
    });
  }

  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({
      error: "Devi specificare almeno un utente"
    });
  }

const cleanProducts = products.map((product) => ({
  product_id: Number(product.product_id),
  quantity: Number(product.quantity ?? 1)
}));

const cleanUserIds = user_ids.map((userId) => Number(userId));

// Non consente lo stesso prodotto due volte nello stesso ordine
const productIds = cleanProducts.map(
  (product) => product.product_id
);

const uniqueProductIds = new Set(productIds);

if (uniqueProductIds.size !== productIds.length) {
  return res.status(400).json({
    error: "Lo stesso prodotto non può essere ripetuto nell'ordine"
  });
}

// Elimina eventuali utenti duplicati
const uniqueUserIds = [...new Set(cleanUserIds)];

for (const product of cleanProducts) {
  if (
    !Number.isInteger(product.product_id) ||
    product.product_id <= 0 ||
    !Number.isInteger(product.quantity) ||
    product.quantity <= 0
  ) {
    return res.status(400).json({
      error: "Prodotti o quantità non validi"
    });
  }
}
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Verifica che tutti i prodotti esistano
for (const product of cleanProducts) {
          const [rows] = await connection.execute(
        "SELECT id FROM products WHERE id = ?",
        [product.product_id]
      );

      if (rows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          error: `Prodotto ${product.product_id} non trovato`
        });
      }
    }

    // Verifica che tutti gli utenti esistano
 for (const userId of uniqueUserIds) {
  const [rows] = await connection.execute(
    "SELECT id FROM users WHERE id = ?",
    [userId]
  );

  if (rows.length === 0) {
    await connection.rollback();

    return res.status(404).json({
      error: `Utente ${userId} non trovato`
    });
  }
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
       [
  orderId,
  product.product_id,
  product.quantity
]
      );
    }

    // Collega gli utenti all'ordine
    for (const userId of uniqueUserIds) {
      await connection.execute(
        `INSERT INTO order_users
         (order_id, user_id)
         VALUES (?, ?)`,
        [orderId, userId]      );
    }

    await connection.commit();

    // Recupera l'ordine appena creato con una sola JOIN
    const [rows] = await pool.execute(
      `
      SELECT
        o.id AS order_id,
        o.created_at,
        o.updated_at,

        p.id AS product_id,
        p.name AS product_name,
        op.quantity,

        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.email

      FROM orders o

      LEFT JOIN order_products op
        ON op.order_id = o.id

      LEFT JOIN products p
        ON p.id = op.product_id

      LEFT JOIN order_users ou
        ON ou.order_id = o.id

      LEFT JOIN users u
        ON u.id = ou.user_id

      WHERE o.id = ?

      ORDER BY p.id ASC, u.id ASC
      `,
      [orderId]
    );

    const order = buildOrders(rows)[0];

    res
      .status(201)
      .location(`/api/orders/${orderId}`)
      .json(order);

  } catch (error) {
    await connection.rollback();

    console.error(
      "Errore nella creazione dell'ordine:",
      error.message
    );

    res.status(500).json({
      error: "Errore interno del server"
    });

  } finally {
    connection.release();
  }
}

// Modifica un ordine
async function updateOrder(req, res) {
  const orderId = Number(req.params.id);
  const { products, user_ids } = req.body;

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      error: "ID dell'ordine non valido"
    });
  }

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      error: "Devi specificare almeno un prodotto"
    });
  }

  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({
      error: "Devi specificare almeno un utente"
    });
  }

  const cleanProducts = products.map((product) => ({
  product_id: Number(product.product_id),
  quantity: Number(product.quantity ?? 1)
}));

const cleanUserIds = user_ids.map((userId) => Number(userId));

// Non consente lo stesso prodotto due volte nello stesso ordine
const productIds = cleanProducts.map(
  (product) => product.product_id
);

const uniqueProductIds = new Set(productIds);

if (uniqueProductIds.size !== productIds.length) {
  return res.status(400).json({
    error: "Lo stesso prodotto non può essere ripetuto nell'ordine"
  });
}

// Elimina eventuali utenti duplicati
const uniqueUserIds = [...new Set(cleanUserIds)];

  for (const product of cleanProducts) {
   if (
  !Number.isInteger(product.product_id) ||
  product.product_id <= 0 ||
  !Number.isInteger(product.quantity) ||
  product.quantity <= 0
) {
      return res.status(400).json({
        error: "Prodotti o quantità non validi"
      });
    }
  }

  for (const userId of uniqueUserIds) {
   if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        error: "ID utente non valido"
      });
    }
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Controlla che l'ordine esista
    const [orders] = await connection.execute(
      "SELECT id FROM orders WHERE id = ?",
      [orderId]
    );

    if (orders.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        error: "Ordine non trovato"
      });
    }

    // Controlla che tutti i prodotti esistano
    for (const product of cleanProducts) {
      const [rows] = await connection.execute(
        "SELECT id FROM products WHERE id = ?",
        [product.product_id]
      );

      if (rows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          error: `Prodotto ${product.product_id} non trovato`
        });
      }
    }

    // Controlla che tutti gli utenti esistano
    for (const userId of uniqueUserIds) {
      const [rows] = await connection.execute(
        "SELECT id FROM users WHERE id = ?",
        [userId]
      );

      if (rows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          error: `Utente ${userId} non trovato`
        });
      }
    }

    // Elimina le vecchie associazioni
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
        [
          orderId,
          Number(product.product_id),
          Number(product.quantity)
        ]
      );
    }

    // Inserisce i nuovi utenti
    for (const userId of uniqueUserIds) {
      await connection.execute(
        `INSERT INTO order_users
         (order_id, user_id)
         VALUES (?, ?)`,
        [orderId, Number(userId)]
      );
    }

    await connection.commit();

    // Recupera l'ordine aggiornato con una sola JOIN
    const [rows] = await pool.execute(
      `
      SELECT
        o.id AS order_id,
        o.created_at,
        o.updated_at,
        p.id AS product_id,
        p.name AS product_name,
        op.quantity,
        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.email
      FROM orders o
      LEFT JOIN order_products op
        ON op.order_id = o.id
      LEFT JOIN products p
        ON p.id = op.product_id
      LEFT JOIN order_users ou
        ON ou.order_id = o.id
      LEFT JOIN users u
        ON u.id = ou.user_id
      WHERE o.id = ?
      ORDER BY p.id ASC, u.id ASC
      `,
      [orderId]
    );

    const order = buildOrders(rows)[0];

    res.status(200).json(order);

  } catch (error) {
    await connection.rollback();

    console.error(
      "Errore nella modifica dell'ordine:",
      error.message
    );

    res.status(500).json({
      error: "Errore interno del server"
    });

  } finally {
    connection.release();
  }
}

// Cancella un ordine
async function deleteOrder(req, res) {
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
}

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder
};