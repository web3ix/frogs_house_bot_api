const express = require("express");
const { parseInitData } = require("@telegram-apps/sdk");
const { validate } = require("@telegram-apps/init-data-node");
const { PrismaClient } = require("@prisma/client");
const TelegramBot = require("node-telegram-bot-api");

const router = express.Router();

const prisma = new PrismaClient();

const bot = new TelegramBot(process.env.BOT_TOKEN_COMM, { polling: true });

const getAccountAgeAndPoint = (id) => {
	const _id = +id;

	const year = +process.env.YEAR;

	let age = 1,
		point = 1100;

	if (isNaN(!_id))
		return {
			age,
			point,
		};

	if (_id <= 10000000) {
		age = year - 2013;
	} else if (_id > 10000000 && _id <= 96000000) {
		age = year - 2014;
	} else if (_id > 96000000 && _id <= 197000000) {
		age = year - 2015;
	} else if (_id > 197000000 && _id <= 319000000) {
		age = year - 2016;
	} else if (_id > 319000000 && _id <= 475500000) {
		age = year - 2017;
	} else if (_id > 475500000 && _id <= 701000000) {
		age = year - 2018;
	} else if (_id > 701000000 && _id <= 1057000000) {
		age = year - 2019;
	} else if (_id > 1057000000 && _id <= 1404500000) {
		age = year - 2020;
	} else if (_id > 1404500000 && _id <= 1623500000) {
		age = year - 2021;
	} else if (_id > 1623500000 && _id <= 1777000000) {
		age = year - 2022;
	} else if (_id > 1777000000 && _id <= 1896750000) {
		age = year - 2023;
	}

	if (age >= 2 && age < 5) {
		point = 1500;
	} else if (age >= 5 && age < 10) {
		point = 2500;
	} else if (age >= 10) {
		point = 3100;
	}

	return {
		age,
		point,
	};
};

/* GET users listing. */
router.get("/", async function (req, res, next) {
	const initData = new URLSearchParams({
		query_id: req.query.query_id,
		user: req.query.user,
		auth_date: req.query.auth_date,
		hash: req.query.hash,
	});

	if (req.query.query_id) {
		if (!req.query.user || !req.query.auth_date || !req.query.hash)
			return res.status(400).send("Missing required query fields");

		try {
			validate(initData, process.env.BOT_TOKEN);
		} catch (error) {
			return res.status(401).send("Unauthorized");
		}
	}

	const initUser = JSON.parse(initData.get("user"));

	const user = await prisma.user.findFirst({
		where: {
			userId: initUser.id.toString(),
		},
		select: {
			id: true,
			userId: true,
			username: true,
			point: true,
			refPoint: true,
			commPoint: true,
			age: true,
			isPremium: true,
			ref: {
				select: {
					id: true,
					refPoint: true,
					ref: {
						select: {
							id: true,
							refPoint: true,
							ref: {
								select: {
									id: true,
									refPoint: true,
								},
							},
						},
					},
				},
			},
			referrals: true,
		},
	});

	if (!user) return res.json({ user: null });

	if (user.commPoint === 0) {
		let joinedComm = false;
		try {
			await bot.getChatMember(process.env.COMM_USERNAME, user.userId);
			joinedComm = true;
		} catch (error) {}
		if (joinedComm) {
			await prisma.user.update({
				where: {
					id: user.id,
				},
				data: {
					commPoint: 1000, // fixed point when joined community
				},
			});
		}
	}

	return res.json({ user });
});

router.post("/", async function (req, res, next) {
	const initData = new URLSearchParams({
		query_id: req.body.query_id,
		user: JSON.stringify(req.body.user),
		auth_date: req.body.auth_date,
		hash: req.body.hash,
	});

	if (req.body.query_id) {
		if (!req.body.user || !req.body.auth_date || !req.body.hash)
			return res.status(400).send("Missing required query fields");

		try {
			validate(initData, process.env.BOT_TOKEN);
		} catch (error) {
			return res.status(401).send("Unauthorized");
		}
	}

	const initUser = JSON.parse(initData.get("user"));

	let user = await prisma.user.findUnique({
		where: {
			userId: initUser.id.toString(),
		},
	});

	if (!user) {
		let ref;
		if (req.body.ref && req.body.ref !== initUser.id.toString()) {
			// ref level 1
			ref = await prisma.user.findUnique({
				where: {
					id: req.body.ref,
				},
				select: {
					id: true,
					refPoint: true,
					ref: {
						select: {
							id: true,
							refPoint: true,
							ref: {
								select: {
									id: true,
									refPoint: true,
								},
							},
						},
					},
				},
			});
		}

		const { age, point } = getAccountAgeAndPoint(initUser.id);

		user = await prisma.user.upsert({
			create: {
				userId: initUser.id.toString(),
				username: initUser?.username ?? "",
				point: point + (initUser.is_premium ? 300 : 0),
				age: age,
				isPremium: initUser.is_premium ?? false,
				refId: ref?.id ?? null,
			},
			update: {},
			where: {
				userId: initUser.id.toString(),
			},
		});

		// tier 1 => 10%, tier 2 & 3 => 5%
		if (ref) {
			await prisma.user.update({
				where: {
					id: ref.id,
				},
				data: {
					refPoint: ref.refPoint + point * 0.1,
				},
			});
		}
		if (ref.ref) {
			await prisma.user.update({
				where: {
					id: ref.ref.id,
				},
				data: {
					refPoint: ref.ref.refPoint + point * 0.05,
				},
			});
		}
		if (ref.ref.ref) {
			await prisma.user.update({
				where: {
					id: ref.ref.ref.id,
				},
				data: {
					refPoint: ref.ref.ref.refPoint + point * 0.05,
				},
			});
		}
	}

	return res.json({ user });
});

module.exports = router;
