const express = require("express");
const { parseInitData } = require("@telegram-apps/sdk");
const { validate } = require("@telegram-apps/init-data-node");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();

const prisma = new PrismaClient();

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
			userId: +initUser.id ?? null,
		},
		select: {
			id: true,
			userId: true,
			username: true,
			point: true,
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
			userId: +initUser.id,
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

		const point =
			Math.floor(1000 + Math.random() * 1000) +
			(initUser.is_premium ? 1000 : 0);

		user = await prisma.user.upsert({
			create: {
				userId: initUser.id,
				username: initUser.username,
				point,
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
