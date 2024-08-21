const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/auth");

const prisma = new PrismaClient();
const router = express.Router();

// Middleware to handle validation errors
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// Create Advertisement
router.post(
  "/directory",
  auth,
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    // body("communityId").notEmpty().withMessage("Community ID is required"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        title,
        description,
        phoneNumber,
        email,
        type,
        backDropImage,
        description2,
        description3,
        expriedDate,
        isPublic,
        communityId,
      } = req.body;

      const directory = await prisma.directory.create({
        data: {
          title,
          description,
          type,
          phoneNumber,
          email,
          backDropImage,
          description2,
          description3,
          expriedDate,
          isPublic,
          communityId,
        },
      });

      res.status(201).json(directory);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);

// Read All Advertisements
router.get("/directory", auth, async (req, res) => {
  try {
    const directorys = await prisma.directory.findMany();
    res.json(directorys);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Read Single Advertisement
router.get("/directory/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const directory = await prisma.directory.findUnique({
      where: { id },
    });

    if (!directory) {
      return res.status(404).json({ error: "Directory not found" });
    }

    res.json(directory);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Update Advertisement
router.put(
  "/directory/:id",
  auth,
  [
    body("title").optional().notEmpty().withMessage("Title cannot be empty"),
    body("description")
      .optional()
      .notEmpty()
      .withMessage("Description cannot be empty"),
    body("communityId")
      .optional()
      .isMongoId()
      .withMessage("Invalid community ID"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const directory = await prisma.directory.update({
        where: { id },
        data,
      });

      res.json(directory);
    } catch (error) {
      console.error(error);
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Directory not found" });
      }
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);

// Delete Advertisement
router.delete("/directory/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.directory.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Directory not found" });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
