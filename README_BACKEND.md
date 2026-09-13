# ISKCON BACE Jia Sarai - MongoDB Backend Setup

This backend connects all devotee data, departments, batches, care groups, and activities to a MongoDB database using Mongoose.

---

## 📁 Directory Structure

```
├── .env                  # Environment configuration (MongoDB URI, Port, Secrets)
├── .env.example          # Sample environment configuration template
├── package.json          # Node dependencies (Express, Mongoose, dotenv, cors)
├── server.js             # Express server setup and REST API entry point
├── config/
│   └── db.js             # Mongoose connection configuration
├── models/
│   ├── Devotee.js        # Comprehensive Devotee schema
│   ├── Department.js     # Department schema
│   ├── Batch.js          # Preaching Batch schema
│   ├── CareGroup.js      # Devotee Care Group schema
│   ├── Activity.js       # Seva, Service, Class & Event schema
│   ├── Attendance.js     # Daily attendance & aarti tracking
│   ├── User.js           # Authentication and roles
│   └── index.js          # Unified model exporter
├── routes/
│   └── devoteeRoutes.js  # REST API endpoints for Devotee CRUD & search
└── scripts/
    └── seedMongo.js      # Seeding script to initialize MongoDB with senior devotees
```

---

## ⚙️ 1. Configuration (`.env`)

Edit your `.env` file to point to your MongoDB instance:

### Option A: Local MongoDB
```env
MONGODB_URI=mongodb://127.0.0.1:27017/bace_management
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:3000
```

### Option B: MongoDB Atlas (Cloud)
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/bace_management?retryWrites=true&w=majority
```

---

## 🚀 2. Installation & Quick Start

1. **Install Node.js** (if not already installed from https://nodejs.org).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Seed initial devotees into MongoDB**:
   ```bash
   npm run seed
   ```
4. **Start the API server**:
   ```bash
   npm run dev    # with hot-reloading via nodemon
   # OR
   npm start      # standard node execution
   ```

---

## 📡 3. REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/devotees` | Retrieve devotees (Supports `?status=`, `?level=`, `?search=`, `?dept=`, `?batch=`) |
| `GET` | `/api/devotees/:id` | Get devotee details by Mongo ID |
| `POST` | `/api/devotees` | Create new devotee profile |
| `PUT` | `/api/devotees/:id` | Update devotee information |
| `DELETE` | `/api/devotees/:id` | Delete devotee profile |
| `POST` | `/api/devotees/bulk` | Bulk insert devotee records |
