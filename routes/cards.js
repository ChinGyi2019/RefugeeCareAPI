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
const { sendResponse } = require("../utils/sendResponse");
require("dotenv").config();

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// get user by id
router.get("/cards", auth, async (req, res) => {
  const userId = req.user.userId;

  try {
    const cards = await prisma.card.findMany({
      where: {
        userId: userId, // filter cards by the user's ID
      },
      orderBy: {
        createdAt: "desc", // Sort in ascending order (oldest first), use 'desc' for descending (newest first)
      },
      include: {
        community: true, // Include the related Community object
      },
    });
    return sendResponse(res, cards, 0, "Success", "success", "");
  } catch (error) {
    console.error(error);
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
    { name: "frontPhoto", maxCount: 1 },
    { name: "backPhoto", maxCount: 1 },
  ]),
  [
    body("cardNumber").notEmpty().withMessage("Card number is required"),
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("communityId").notEmpty().withMessage("Community ID is required"),
    body("dateOfBirth").notEmpty().withMessage("Date of birth is required"),
    body("nationality").notEmpty().withMessage("Nationality is required"),
    body("gender").notEmpty().withMessage("Gender is required"),
    (req, res, next) => {
      if (!req.files.passportPhoto) {
        return sendResponse(
          res,
          null,
          400,
          "Error",
          "Please upload the required file(s)",
          "passportPhoto is required"
        );
      }
      if (!req.files.frontPhoto) {
        return sendResponse(
          res,
          null,
          400,
          "Error",
          "Please upload the required file(s)",
          "frontPhoto is required"
        );
      }
      if (!req.files.backPhoto) {
        return sendResponse(
          res,
          null,
          400,
          "Error",
          "Please upload the required file(s)",
          "backPhoto is required"
        );
      }
      next();
    },
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessage = errors
          .array()
          .map((error) => error.msg + " " + error.param)
          .join(", ");
        return sendResponse(
          res,
          null,
          400,
          "Error",
          "Validation failed",
          errorMessage
        );
      }

      // Extract file buffers
      const passportPhotoBuffer = req.files.passportPhoto
        ? req.files.passportPhoto[0].buffer
        : null;
      const frontPhotoBuffer = req.files.frontPhoto
        ? req.files.frontPhoto[0].buffer
        : null;
      const backPhotoBuffer = req.files.backPhoto
        ? req.files.backPhoto[0].buffer
        : null;

      // Generate file paths
      const fileNamePrefix = Date.now();
      const uploadDirectory = process.env.STORAGE_URL;
      const passportPhotoPath = passportPhotoBuffer
        ? path.join(uploadDirectory, `${fileNamePrefix}-passportPhoto.jpg`)
        : null;
      const frontPhotoPath = frontPhotoBuffer
        ? path.join(uploadDirectory, `${fileNamePrefix}-forntPhoto.jpg`)
        : null;
      const backPhotoPath = backPhotoBuffer
        ? path.join(uploadDirectory, `${fileNamePrefix}-backPhoto.jpg`)
        : null;

      const userId = req.user.userId;
      const parseDate = (dateString) => {
        // Try to parse the date string
        const date = new Date(dateString);
        // Check if the date is valid
        if (isNaN(date.getTime())) {
          // If the date is invalid, return null or a default date
          return null; // or return new Date(); for current date
        }
        return date;
      };
      // Save files to disk after card creation
      const card = await prisma.card.create({
        data: {
          cardNumber: req.body.cardNumber,
          fullName: req.body.fullName,
          dateOfBirth: req.body.dateOfBirth,
          nationality: req.body.nationality,
          dateOfIssue: parseDate(req.body.dateOfIssue) || new Date(),
          dateOfexpiry: parseDate(req.body.dateOfexpiry),
          gender: req.body.gender,
          uNCardNumber: req.body.uNCardNumber,
          studentNumber: req.body.studentNumber,
          passportPhoto: passportPhotoPath,
          frontPhoto: frontPhotoPath,
          backPhoto: backPhotoPath,
          status: req.body.status,
          active: req.body.active ?? true,
          communityId: req.body.communityId,
          userId: userId,
        },
        // data: {
        //   ...req.body,
        //   passportPhoto: passportPhotoPath,
        //   frontPhoto: frontPhotoPath,
        //   backPhoto: backPhotoPath,
        // },
      });

      if (passportPhotoBuffer) {
        fs.writeFileSync(passportPhotoPath, passportPhotoBuffer);
      }
      if (frontPhotoBuffer) {
        fs.writeFileSync(frontPhotoPath, frontPhotoBuffer);
      }
      if (backPhotoBuffer) {
        fs.writeFileSync(backPhotoPath, backPhotoBuffer);
      }

      const allCards = await prisma.card.findMany({
        where: {
          userId: userId,
        },
        include: {
          community: true, // Include the related Community object
        },
        orderBy: {
          createdAt: "desc", // Sort in ascending order (oldest first), use 'desc' for descending (newest first)
        },
      });

      return sendResponse(
        res,
        allCards,
        0,
        "Success",
        "Card created successfully",
        "CARD_CREATED"
      );
    } catch (error) {
      console.error(error);
      return sendResponse(
        res,
        null,
        500,
        "Error",
        "Something went wrong",
        error.message
      );
    }
  }
);
// router.post(
//   "/cards",
//   auth,
//   upload.fields([
//     { name: "passportPhoto", maxCount: 1 },
//     { name: "forntPhoto", maxCount: 1 },
//     { name: "backPhoto", maxCount: 1 },
//   ]),
//   [
//     body("cardNumber").notEmpty().withMessage("Card number is required"),
//     // body("email")
//     //   .notEmpty()
//     //   .withMessage("Email is required")
//     //   .isEmail()
//     //   .withMessage("Invalid email format"),
//     body("fullName").notEmpty().withMessage("Full name is required"),
//     body("communityId")
//       .notEmpty()
//       .withMessage("Community ID is required")
//       .isMongoId()
//       .withMessage("Invalid Community ID format"),
//     body("dateOfBirth").notEmpty().withMessage("Date of birth is required"),
//     body("nationality").notEmpty().withMessage("Nationality is required"),
//     body("gender").notEmpty().withMessage("Gender is required"),
//     // body("status").notEmpty().withMessage("Status is required"),
//     (req, res, next) => {
//       // Validate that at least one photo is uploaded
//       if (!req.files.passportPhoto) {
//         return res.status(400).json({
//           error: "(passportPhoto) is required",
//         });
//       }
//       if (!req.files.forntPhoto) {
//         return res.status(400).json({
//           error: "(forntPhoto) is required",
//         });
//       }
//       if (!req.files.backPhoto) {
//         return res.status(400).json({
//           error: "(backPhoto) is required",
//         });
//       }
//       next();
//     },
//   ],
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     try {
//       // Extract file buffers from the uploaded files
//       const passportPhotoBuffer = req.files.passportPhoto
//         ? req.files.passportPhoto[0].buffer
//         : null;
//       const forntPhotoBuffer = req.files.forntPhoto
//         ? req.files.forntPhoto[0].buffer
//         : null;
//       const backPhotoBuffer = req.files.backPhoto
//         ? req.files.backPhoto[0].buffer
//         : null;

//       // Generate file paths for permanent storage
//       const fileNamePrefix = Date.now();
//       const uploadDirectory = process.env.STOARAGE_URL;
//       const passportPhotoPath = passportPhotoBuffer
//         ? path.join(uploadDirectory, `${fileNamePrefix}-passportPhoto.jpg`)
//         : null;
//       const forntPhotoPath = forntPhotoBuffer
//         ? path.join(uploadDirectory, `${fileNamePrefix}-forntPhoto.jpg`)
//         : null;
//       const backPhotoPath = backPhotoBuffer
//         ? path.join(uploadDirectory, `${fileNamePrefix}-backPhoto.jpg`)
//         : null;

//       //  Create the card entry with the file paths included
//       const card = await prisma.card.create({
//         data: {
//           ...req.body,
//           passportPhoto: passportPhotoPath,
//           forntPhoto: forntPhotoPath,
//           backPhoto: backPhotoPath,
//         },
//       });
//       // Save the files to disk only if the card creation is successful
//       if (passportPhotoBuffer) {
//         fs.writeFileSync(passportPhotoPath, passportPhotoBuffer);
//       }
//       if (forntPhotoBuffer) {
//         fs.writeFileSync(forntPhotoPath, forntPhotoBuffer);
//       }
//       if (backPhotoBuffer) {
//         fs.writeFileSync(backPhotoPath, backPhotoBuffer);
//       }
//       res.json(card);
//     } catch (error) {
//       console.error(error);
//       res.status(400).json({ error: error.message });
//     }
//   }
// );
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
