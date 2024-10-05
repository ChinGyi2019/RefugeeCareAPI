const express = require("express");
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const { route } = require("./auth");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { sendResponse } = require("../utils/sendResponse");
const prisma = new PrismaClient();

// Create a new community with validation
router.post(
  "/communities",
  auth,
  [
    body("name").notEmpty().withMessage("Community name is required"),
    body("email")
      .isArray({ min: 1 })
      .withMessage("At least one email is required")
      .custom((emails) => {
        emails.forEach((email) => {
          if (!/\S+@\S+\.\S+/.test(email)) {
            throw new Error(`Invalid email format: ${email}`);
          }
        });
        return true;
      }),
    body("phoneNumber")
      .optional()
      .isArray()
      .withMessage("Phone numbers should be an array of strings"),
    body("description").notEmpty().withMessage("Description is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const community = await prisma.community.create({
          data: req.body,
        });
        res.json(community);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

// Update an existing community with validation
router.put(
  "/communities/:id",
  auth,
  [
    // (body("name")
    //   .optional()
    //   .notEmpty()
    //   .withMessage("Community name cannot be empty"),
    // body("email")
    //   .optional()
    //   .isArray()
    //   .withMessage("Emails should be an array of strings")
    //   .custom((emails) => {
    //     emails.forEach((email) => {
    //       if (!/\S+@\S+\.\S+/.test(email)) {
    //         throw new Error(`Invalid email format: ${email}`);
    //       }
    //     });
    //     return true;
    //   }),
    // body("phoneNumber")
    //   .optional()
    //   .isArray()
    //   .withMessage("Phone numbers should be an array of strings"),
    // body("description")
    //   .optional()
    //   .notEmpty()
    //   .withMessage("Description cannot be empty")),
  ],
  async (req, res) => {
    const { id } = req.params;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updatedCommunity = await prisma.community.update({
        where: { id },
        data: req.body,
      });
      res.json(updatedCommunity);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);
// get community by id
router.get("/communities/:id", auth, async (req, res) => {
  const { id } = req.params;
  const community = await prisma.community.findUnique({
    where: { id },
  });
  res.json(community);
});
// get all community
router.get("/communities", async (req, res) => {
  try {
    const communities = await prisma.community.findMany();
    // res.json(communities);
    return sendResponse(res, communities, 0, "Success", "success", "");
  } catch (excetpion) {
    console.error(excetpion);
    return sendResponse(
      res,
      null,
      500,
      "Error",
      "Something went wrong",
      excetpion.message
    );
  }
});
// delete community
router.delete("/communities/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.community.delete({
      where: { id },
    });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Fetch cards by community
router.get("/communities/:id/cards", async (req, res) => {
  const { id } = req.params;

  try {
    const cards = await prisma.card.findMany({
      where: { communityId: id },
    });

    if (cards.length === 0) {
      return res
        .status(404)
        .json({ message: "No cards found for this community." });
    }

    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
