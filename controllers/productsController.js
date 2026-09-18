const pool = require("../db");

// Recupera tutti i prodotti
async function getProducts(req, res) {
  try {
    const [products] = await pool.execute(
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
}

// Recupera un prodotto tramite ID
async function getProductById(req, res) {
  const productId = Number(req.params.id);

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
}

// Inserisce un nuovo prodotto
async function createProduct(req, res) {
  const { name } = req.body;

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
      `INSERT INTO products (name)
       VALUES (?)`,
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
}

// Modifica un prodotto
async function updateProduct(req, res) {
  const productId = Number(req.params.id);
  const { name } = req.body;

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({
      error: "ID del prodotto non valido"
    });
  }

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
      `UPDATE products
       SET name = ?
       WHERE id = ?`,
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
}

// Cancella un prodotto
async function deleteProduct(req, res) {
  const productId = Number(req.params.id);

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

    res.status(204).send();
  } catch (error) {
    console.error("Errore nella cancellazione del prodotto:", error.message);

    res.status(500).json({
      error: "Errore interno del server"
    });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};