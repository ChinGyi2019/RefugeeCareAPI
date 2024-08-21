const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { body, validationResult } = require("express-validator");

const prisma = new PrismaClient();
const router = express.Router();

// Create a new notification
router.post(
  "/notifications",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("communityId").notEmpty().withMessage("Community ID is required"),
    body("expriedDate")
      .optional()
      .isISO8601()
      .withMessage("Expired Date must be a valid date"),
    body("active")
      .optional()
      .isBoolean()
      .withMessage("Active must be a boolean"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const notification = await prisma.notification.create({
        data: req.body,
      });
      res.json(notification);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Get all notifications (including public ones)
router.get("/notifications", async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { isPublic: true },
          { communityId: req.query.communityId || undefined },
        ],
      },
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications by community ID
router.get("/communities/:id/notifications", async (req, res) => {
  const { id } = req.params;

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        communityId: id,
      },
    });

    if (notifications.length === 0) {
      return res
        .status(404)
        .json({ message: "No notifications found for this community." });
    }

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a notification
router.put(
  "/notifications/:id",
  [
    body("title").optional().notEmpty().withMessage("Title cannot be empty"),
    body("description")
      .optional()
      .notEmpty()
      .withMessage("Description cannot be empty"),
    body("isPublic")
      .optional()
      .isBoolean()
      .withMessage("isPublic must be a boolean"),
    body("expriedDate")
      .optional()
      .isISO8601()
      .withMessage("Expired Date must be a valid date"),
    body("active")
      .optional()
      .isBoolean()
      .withMessage("Active must be a boolean"),
  ],
  async (req, res) => {
    const { id } = req.params;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updatedNotification = await prisma.notification.update({
        where: { id },
        data: req.body,
      });
      res.json(updatedNotification);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Delete a notification
router.delete("/notifications/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.notification.delete({
      where: { id },
    });
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
