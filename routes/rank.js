const express = require("express");
const { parseInitData } = require("@telegram-apps/sdk");
const { validate } = require("@telegram-apps/init-data-node");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();

const prisma = new PrismaClient();

/* GET users listing. */
router.get("/", async function (req, res, next) {
	if (!req.query.user_id)
		return res.status(400).send("Missing required query field user_id");

	const initUser = JSON.parse(initData.get("user"));

	const user = await prisma.user.findFirst({
		where: {
			userId: +req.query.user_id ?? null,
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

	const result =
		(await prisma.$queryRaw) <
		{
			rank: number,
		} >
		`
             SELECT rank FROM (
                SELECT id, ROW_NUMBER() OVER (ORDER BY "point" DESC) as rank FROM "User"
            ) ranked_users
            WHERE id = ${user.id}
        `;

	const total = await prisma.user.count();

	const top500 = await prisma.user.findMany({
		orderBy: {
			point: "desc",
		},
		take: 500,
	});

	return res.json({
		total,
		top500,
		rank: result[0]?.rank || null,
	});
});

module.exports = router;
