const express = require("express");
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const multer = require("multer");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const process = require("process");
const fs = require("fs");
require("dotenv").config();

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// get all cards
router.get("/cards", auth, async (req, res) => {
  const cards = await prisma.card.findMany();
  res.json(cards);
});

// get card by ID
router.get("/cards/:id", auth, async (req, res) => {
  const { id } = req.params;
  const card = await prisma.card.findUnique({
    where: { id },
  });
  res.json(card);
});

// Create a new card with validation
router.post(
  "/cards",
  auth,
  upload.fields([
    { name: "passportPhoto", maxCount: 1 },
    { name: "forntPhoto", maxCount: 1 },
    { name: "backPhoto", maxCount: 1 },
  ]),
  [
    body("cardNumber").notEmpty().withMessage("Card number is required"),
    // body("email")
    //   .notEmpty()
    //   .withMessage("Email is required")
    //   .isEmail()
    //   .withMessage("Invalid email format"),
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("communityId")
      .notEmpty()
      .withMessage("Community ID is required")
      .isMongoId()
      .withMessage("Invalid Community ID format"),
    body("dateOfBirth").notEmpty().withMessage("Date of birth is required"),
    body("nationality").notEmpty().withMessage("Nationality is required"),
    body("gender").notEmpty().withMessage("Gender is required"),
    // body("status").notEmpty().withMessage("Status is required"),
    (req, res, next) => {
      // Validate that at least one photo is uploaded
      if (!req.files.passportPhoto) {
        return res.status(400).json({
          error: "(passportPhoto) is required",
        });
      }
      if (!req.files.forntPhoto) {
        return res.status(400).json({
          error: "(forntPhoto) is required",
        });
      }
      if (!req.files.backPhoto) {
        return res.status(400).json({
          error: "(backPhoto) is required",
        });
      }
      next();
    },
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Extract file buffers from the uploaded files
      const passportPhotoBuffer = req.files.passportPhoto
        ? req.files.passportPhoto[0].buffer
        : null;
      const forntPhotoBuffer = req.files.forntPhoto
        ? req.files.forntPhoto[0].buffer
        : null;
      const backPhotoBuffer = req.files.backPhoto
        ? req.files.backPhoto[0].buffer
        : null;

      // Generate file paths for permanent storage
      const fileNamePrefix = Date.now();
      const uploadDirectory = process.env.STOARAGE_URL;
      const passportPhotoPath = passportPhotoBuffer
        ? path.join(uploadDirectory, `${fileNamePrefix}-passportPhoto.jpg`)
        : null;
      const forntPhotoPath = forntPhotoBuffer
        ? path.join(uploadDirectory, `${fileNamePrefix}-forntPhoto.jpg`)
        : null;
      const backPhotoPath = backPhotoBuffer
        ? path.join(uploadDirectory, `${fileNamePrefix}-backPhoto.jpg`)
        : null;

      // Create the card entry with the file paths included
      const card = await prisma.card.create({
        data: {
          ...req.body,
          passportPhoto: passportPhotoPath,
          forntPhoto: forntPhotoPath,
          backPhoto: backPhotoPath,
        },
      });
      // Save the files to disk only if the card creation is successful
      if (passportPhotoBuffer) {
        fs.writeFileSync(passportPhotoPath, passportPhotoBuffer);
      }
      if (forntPhotoBuffer) {
        fs.writeFileSync(forntPhotoPath, forntPhotoBuffer);
      }
      if (backPhotoBuffer) {
        fs.writeFileSync(backPhotoPath, backPhotoBuffer);
      }
      res.json(card);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }
);
// update card
router.put(
  "/cards/:id",
  auth,
  [
    // body("cardNumber")
    //   .optional()
    //   .notEmpty()
    //   .withMessage("Card number cannot be empty"),
    // body("email")
    //   .optional()
    //   .notEmpty()
    //   .withMessage("Email cannot be empty")
    //   .isEmail()
    //   .withMessage("Invalid email format"),
    // body("fullName")
    //   .optional()
    //   .notEmpty()
    //   .withMessage("Full name cannot be empty"),
    // body("communityId")
    //   .optional()
    //   .notEmpty()
    //   .withMessage("Community ID cannot be empty"),
  ],
  async (req, res) => {
    const { id } = req.params;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updatedCard = await prisma.card.update({
        where: { id },
        data: req.body,
      });
      res.json(updatedCard);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);
// delete card by ID
router.delete("/cards/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.card.delete({
      where: { id },
    });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
