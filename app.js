const createError = require("http-errors");
const express = require("express");
// const path = require("path");
// const cookieParser = require("cookie-parser");
const logger = require("morgan");
const TelegramBot = require("node-telegram-bot-api");
var cors = require("cors");
require("dotenv").config();

if (!process.env.BOT_TOKEN) throw new Error("Config bot api first");

// const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const app = express();

// view engine setup
// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "jade");

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	// render the error page
	return res.status(err.status || 500);
	// res.render("error");
});

// setup telegram bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Listen for any kind of message. There are different kinds of messages.
bot.on("message", (msg) => {
	bot.sendPhoto(msg.chat.id, "https://imgur.com/xB8KDfA", {
		caption:
			"How cool is your Telegram profile? Check your rating and receive rewards 🐸",
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "Let's go",
						url: "https://t.me/frogs_house_bot/join",
					},
					{
						text: "Join Frogs community",
						url: "https://t.me/frogs_housecm",
					},
				],
			],
		},
	});

	// send a message to the chat acknowledging receipt of their message
	// bot.sendMessage(chatId, "Received your message");
	// @frogs_housecm
	// bot.sendPhoto("-1002234950719", "https://imgur.`com/xB8KDfA", {
	// 	caption:
	// 		"<strong>🎉🐸 Community Growth Alert! 🐸🎉</strong>\n\nOur community has grown rapidly, and it's time to check the leaderboard!\n\n<i>Stay engaged, keep participating, and see where you stand! 🐸</i>",
	// 	parse_mode: "HTML",
	// 	reply_markup: {
	// 		inline_keyboard: [
	// 			[
	// 				{
	// 					text: "Launch",
	// 					url: "https://t.me/frogs_house_bot/join",
	// 				},
	// 			],
	// 		],
	// 	},
	// });
});

module.exports = app;
