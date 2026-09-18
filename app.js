const express = require("express");

const productsRoutes = require("./routes/productsRoutes");
const usersRoutes = require("./routes/usersRoutes");
const ordersRoutes = require("./routes/ordersRoutes");

const app = express();

// Permette di ricevere JSON nelle richieste
app.use(express.json());

// Rotta principale
app.get("/", (req, res) => {
  res.status(200).json({
    message: "API Orizon attiva"
  });
});

// Rotte API
app.use("/api/products", productsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/orders", ordersRoutes);

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

module.exports = app;