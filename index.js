require("dotenv").config();

const app = require("./app");
const pool = require("./db");

const PORT = process.env.PORT || 3000;

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