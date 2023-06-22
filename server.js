const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

mongoose
  .connect("mongodb+srv://nowy:wwwww@cluster0.qvxwnw9.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "your-database-name",
  })
  .then(() => {
    console.log("Успешное подключение к базе данных");
  })
  .catch((error) => {
    console.error("Ошибка при подключении к базе данных", error);
  });

const messageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model("Message", messageSchema);

const bot = new TelegramBot("6201317143:AAFo6tQ_BVQpE5hK2F5f47mkSesKYQRkeo8", {
  polling: true,
});

app.use(express.json());
app.use(cors());

app.post(
  "/api/messages",
  [
    body("username")
      .notEmpty()
      .withMessage("Имя пользователя не может быть пустым"),
    body("email")
      .notEmpty()
      .withMessage("Email не может быть пустым")
      .isEmail()
      .withMessage("Неверный формат email"),
    body("message").notEmpty().withMessage("Сообщение не может быть пустым"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, message } = req.body;

    const newMessage = new Message({ username, email, message });

    newMessage
      .save()
      .then(() => {
        console.log("Сообщение сохранено в базе данных");
        res.json({ message: "Сообщение успешно сохранено" });

        const telegramMessage = `Новое сообщение от пользователя:
😎Имя: ${username}
🥀Email: ${email}
👨🏻‍💻Сообщение: ${message}`;

        bot
          .sendMessage("1814654847", telegramMessage)
          .then(() => {
            console.log("Сообщение отправлено в Telegram");
          })
          .catch((error) => {
            console.error("Ошибка при отправке сообщения в Telegram", error);
          });
      })
      .catch((error) => {
        console.error("Ошибка при сохранении сообщения", error);
        res.status(500).json({ message: "Ошибка сервера" });
      });
  }
);

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("Соединение с базой данных закрыто");
    process.exit(0);
  } catch (error) {
    console.error("Ошибка при закрытии соединения с базой данных", error);
    process.exit(1);
  }
});
