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

	const result = await prisma.$queryRaw`
             SELECT rank FROM (
                SELECT "userId", ROW_NUMBER() OVER (ORDER BY (point + "refPoint" + "commPoint") DESC) as rank FROM "User"
            ) ranked_users
            WHERE "userId" = ${req.query.user_id}
        `;

	const total = await prisma.user.count();

	const top500 = await prisma.$queryRaw`
        SELECT *, (point + "refPoint" + "commPoint") AS totalPoints
        FROM "User"
        ORDER BY totalPoints DESC
    `;

	return res.json({
		total,
		top500,
		rank: result[0]?.rank.toString() || null,
	});
});

module.exports = router;
