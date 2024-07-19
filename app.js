const createError = require("http-errors");
const express = require("express");
// const path = require("path");
// const cookieParser = require("cookie-parser");
const logger = require("morgan");
const TelegramBot = require("node-telegram-bot-api");
var cors = require("cors");
require("dotenv").config();

if (!process.env.BOT_TOKEN) throw new Error("Config bot api first");
if (!process.env.BOT_TOKEN_COMM) throw new Error("Config bot api first");
if (!process.env.COMM_USERNAME)
	throw new Error("Config community username first");

// const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const rankRouter = require("./routes/rank");

const app = express();

// view engine setup
// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "jade");

app.use(
	cors({
		// origin: "https://frog-house-mini-app.vercel.app/",
		// optionsSuccessStatus: 200,
	})
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/rank", rankRouter);

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

if (process.env.IS_BOT == 1) {
	// setup telegram bot
	const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

	// Listen for any kind of message. There are different kinds of messages.
	bot.on("message", (msg) => {
		bot.sendPhoto(msg.chat.id, "https://imgur.com/a/ZdytAmy", {
			caption: `🐸 Community Growth Announcement! 🐸

Dogs, cats, and what's next generation ??? 🐾 🐸

Get started today 🔥

Our community is expanding rapidly, and it's time to check out the leaderboard! This growth reflects the enthusiasm and dedication of all our members. We’re excited to welcome new faces and appreciate the contributions from members.

Let’s keep the momentum going and make our community even stronger`,
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: "Let's go",
							web_app: {
								url: "https://t.me/frogs_house_bot/join",
							},
						},
						{
							text: "Join Frogs community",
							url: "https://t.me/frogs_housecm",
						},
					],
				],
			},
		});
	});
}

module.exports = app;
