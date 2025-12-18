// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { initDB } from "./db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

// ===== PATH / STATIC =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== APP =====
const app = express();
app.use(cors());
app.use(express.json());

// Віддаємо статичні файли з кореня проєкту (chat.html, history.html, firebase.js тощо)
app.use(express.static(__dirname));

// ===== MONITORING / LOGGING =====
app.use((req, res, next) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${req.method} ${req.url}`);
  next();
});

// ===== DB =====
const db = await initDB();

// ===== JWT =====
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET); // { id, username }
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ===== OPENAI =====
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// ===== AUTH ROUTES =====

// Реєстрація
app.post("/register", async (req, res) => {
  try {
    const username = (req.body?.username || "").trim();
    const password = (req.body?.password || "").trim();
    if (!username || !password) {
      return res.status(400).json({ error: "username/password required" });
    }

    const hash = await bcrypt.hash(password, 10);

    await db.run(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username, hash]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    res.status(400).json({ error: "User exists or bad data" });
  }
});

// Логін
app.post("/login", async (req, res) => {
  try {
    const username = (req.body?.username || "").trim();
    const password = (req.body?.password || "").trim();
    if (!username || !password) {
      return res.status(400).json({ error: "username/password required" });
    }

    const user = await db.get(
      "SELECT id, username, password_hash FROM users WHERE username = ?",
      [username]
    );

    if (!user) return res.status(401).json({ error: "Wrong credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Wrong credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ token });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== CHAT =====
app.post("/chat", auth, async (req, res) => {
  try {
    const userMessage = (req.body?.message || "").trim();
    if (!userMessage) {
      return res.status(400).json({ reply: "Порожнє повідомлення" });
    }

    const userId = req.user.id;

    await db.run(
      "INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)",
      [userId, "user", userMessage]
    );

    let botReply = "🤖 Демо-відповідь (OpenAI не підключений)";

    if (openai) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userMessage }],
      });

      botReply =
        completion?.choices?.[0]?.message?.content ||
        "❌ OpenAI не повернув відповідь";
    }

    await db.run(
      "INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)",
      [userId, "assistant", botReply]
    );

    // 🔴 ОЦЕ ГОЛОВНЕ
    return res.json({ reply: botReply });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({
      reply: "❌ Помилка сервера"
    });
  }
});

// ===== START =====
const PORT = 3000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Open chat: http://localhost:${PORT}/chat.html`);
  });
}

export default app;
