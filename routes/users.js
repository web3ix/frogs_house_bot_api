const express = require("express");
const { parseInitData } = require("@telegram-apps/sdk");
const { validate } = require("@telegram-apps/init-data-node");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();

const prisma = new PrismaClient();

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
	}
	if (_id <= 96000000) {
		age = year - 2014;
	}
	if (_id <= 197000000) {
		age = year - 2015;
	}
	if (_id <= 319000000) {
		age = year - 2016;
	}
	if (_id <= 475500000) {
		age = year - 2017;
	}
	if (_id <= 701000000) {
		age = year - 2018;
	}
	if (_id <= 1057000000) {
		age = year - 2019;
	}
	if (_id <= 1404500000) {
		age = year - 2020;
	}
	if (_id <= 1623500000) {
		age = year - 2021;
	}
	if (_id <= 1777000000) {
		age = year - 2022;
	}
	if (_id <= 1896750000) {
		age = year - 2023;
	}

	if (age >= 2 && age < 5) {
		point = 1500;
	} else if (age >= 5 && age < 10) {
		point = 2500;
	} else {
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
			userId: initUser.id,
		},
		select: {
			id: true,
			userId: true,
			username: true,
			point: true,
			age: true,
			isPremium: true,
			ref: true,
			referrals: true,
		},
	});

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
			userId: initUser.id,
		},
	});

	if (!user) {
		let ref;
		if (req.body.ref) {
			ref = await prisma.user.findUnique({
				where: {
					id: req.body.ref,
				},
			});
		}

		const { age, point } = getAccountAgeAndPoint(initUser.id);

		user = await prisma.user.upsert({
			create: {
				userId: initUser.id,
				username: initUser.username,
				point: point + (initUser.is_premium ? 300 : 0),
				age: age,
				isPremium: initUser.is_premium ?? false,
				refId: ref?.id ?? null,
			},
			update: {},
			where: {
				userId: initUser.id,
			},
		});

		if (ref) {
			await prisma.user.update({
				where: {
					id: ref.id,
				},
				data: {
					point: ref.point + point * 0.05,
				},
			});
		}
	}

	return res.json({ user });
});

module.exports = router;
