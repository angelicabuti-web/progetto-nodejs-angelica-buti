# API RESTful Orizon

Progetto Node.js realizzato per Orizon, un'agenzia di viaggi orientata al turismo sostenibile.

L'applicazione mette a disposizione API JSON RESTful per gestire:

- prodotti e viaggi;
- utenti;
- ordini;
- associazioni tra ordini, prodotti e utenti;
- filtri degli ordini per data e prodotto.

Non è previsto un front end. Le API possono essere provate tramite Postman.

## Tecnologie utilizzate

- Node.js
- Express.js
- MySQL
- mysql2
- dotenv
- Postman


## Struttura del progetto

```text
progetto-nodejs-angelica-buti/
│
├── controllers/
│   ├── productsController.js
│   ├── usersController.js
│   └── ordersController.js
│
├── routes/
│   ├── productsRoutes.js
│   ├── usersRoutes.js
│   └── ordersRoutes.js
│
├── app.js
├── index.js
├── db.js
├── migrations.sql
├── .env.example
├── package.json
└── README.md


## Requisiti

Prima di avviare il progetto è necessario installare:

- Node.js
- MySQL Server

## Installazione

Clonare il repository e installare le dipendenze:

```bash
npm install
```

## Configurazione del database

Eseguire il file:

```text
migrations.sql
```

all'interno di MySQL Workbench.

Il file crea:

- il database `orizon_db`;
- la tabella `products`;
- la tabella `users`;
- la tabella `orders`;
- la tabella `order_products`;
- la tabella `order_users`.

## Variabili d'ambiente

Creare un file `.env` nella cartella principale prendendo come riferimento `.env.example`.

Esempio:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=orizon_db
PORT=3000
```

Il file `.env` non viene caricato su GitHub perché contiene dati riservati.

## Avvio del progetto

Avvio normale:

```bash
npm start
```

Avvio in modalità sviluppo:

```bash
npm run dev
```

Il server sarà disponibile su:

```text
http://localhost:3000
```

## Endpoint principali

### Prodotti

| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/products` | Recupera tutti i prodotti |
| GET | `/api/products/:id` | Recupera un prodotto |
| POST | `/api/products` | Inserisce un prodotto |
| PUT | `/api/products/:id` | Modifica un prodotto |
| DELETE | `/api/products/:id` | Cancella un prodotto |

Esempio di prodotto:

```json
{
  "name": "Tour sostenibile in Costa Rica"
}
```

### Utenti

| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/users` | Recupera tutti gli utenti |
| GET | `/api/users/:id` | Recupera un utente |
| POST | `/api/users` | Inserisce un utente |
| PUT | `/api/users/:id` | Modifica un utente |
| DELETE | `/api/users/:id` | Cancella un utente |

Esempio di utente:

```json
{
  "first_name": "Angelica",
  "last_name": "Buti Garcia",
  "email": "angelica.esempio@gmail.com"
}
```

### Ordini

| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/orders` | Recupera tutti gli ordini |
| GET | `/api/orders/:id` | Recupera un ordine |
| POST | `/api/orders` | Inserisce un ordine |
| PUT | `/api/orders/:id` | Modifica un ordine |
| DELETE | `/api/orders/:id` | Cancella un ordine |

Esempio di ordine:

```json
{
  "products": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ],
  "user_ids": [1]
}
```

## Filtri degli ordini

Filtro per prodotto:

```text
GET /api/orders?product_id=1
```

Filtro per data:

```text
GET /api/orders?date=2026-08-02
```

Filtri combinati:

```text
GET /api/orders?date=2026-08-02&product_id=1
```

La data deve essere scritta nel formato:

```text
YYYY-MM-DD
```

## Status code utilizzati

- `200 OK`: richiesta completata;
- `201 Created`: risorsa creata;
- `204 No Content`: risorsa cancellata;
- `400 Bad Request`: dati non validi;
- `404 Not Found`: risorsa non trovata;
- `409 Conflict`: email già presente;
- `500 Internal Server Error`: errore interno.

## Sicurezza e integrità dei dati

Le query utilizzano prepared statement con valori parametrizzati per ridurre il rischio di SQL Injection.

La creazione e la modifica degli ordini utilizzano transazioni MySQL. In caso di errore, tutte le operazioni vengono annullate per evitare dati incompleti.

Le credenziali del database sono conservate nel file `.env`, escluso dal repository tramite `.gitignore`.