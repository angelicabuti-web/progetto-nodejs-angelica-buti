const pool = require("../db");

// Recupera tutti gli utenti
async function getUsers(req, res) {
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
}


// Recupera un singolo utente tramite ID
async function getUserById(req, res) {
  const userId = Number(req.params.id);

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
}

// Crea un nuovo utente
async function createUser(req, res) {
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
}

// Modifica un utente
async function updateUser(req, res) {
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
}

// Cancella un utente
async function deleteUser(req, res) {
  const userId = Number(req.params.id);

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
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};