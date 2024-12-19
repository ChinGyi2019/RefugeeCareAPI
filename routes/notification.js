const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { body, validationResult } = require("express-validator");
const { sendResponse } = require("../utils/sendResponse");
const prisma = new PrismaClient();
const router = express.Router();

// Create a new notification
router.post(
  "/notifications",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("communityId").notEmpty().withMessage("Community ID is required"),
    // body("expriedDate")
    //   .optional()
    //   .isISO8601()
    //   .withMessage("Expired Date must be a valid date"),
    body("active")
      .optional()
      .isBoolean()
      .withMessage("Active must be a boolean"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const { title, description, communityId, active, expiredDate } =
          req.body;
        const notification = await prisma.notification.create({
          data: {
            title: title,
            description: description,
            communityId: communityId,
            expriedDate: expiredDate
              ? new Date(expiredDate).toISOString()
              : new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days from now
            active: active || false, // default to false if not provided
          },
        });
        res.json(notification);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

// Get all notifications (including public ones)
router.get("/notifications", async (req, res) => {
  try {
    const { communityId } = req.path;
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [{ isPublic: true }, { communityId: communityId || undefined }],
      },
    });

    return sendResponse(res, notifications, 0, "Success", "success", "");
  } catch (exception) {
    console.error(exception);
    return sendResponse(
      res,
      null,
      500,
      "Error",
      "Something went wrong",
      exception.message
    );
  }
});

// Get notifications by community ID
router.get("/communities/:id/notifications", async (req, res) => {
  try {
    const { id } = req.params;
    const notifications = await prisma.notification.findMany({
      where: {
        communityId: id,
      },
      include: {
        community: {
          select: {
            name: true,
            shortName: true,
          },
        },
      },
    });

    if (notifications.length === 0) {
      return res
        .status(404)
        .json({ message: "No notifications found for this community." });
    }

    return sendResponse(
      res,
      notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        description: notification.description,
        communityId: notification.communityId,
        expiredDate: notification.expriedDate,
        active: notification.active,
        createdAt: notification.createdAt,
        communityName: notification.community.name,
        communityShortName: notification.community.shortName,
      })),
      0,
      "Success",
      "success",
      ""
    );
  } catch (exception) {
    console.error(exception);
    return sendResponse(
      res,
      null,
      500,
      "Error",
      "Something went wrong",
      exception.message
    );
  }
});
// Get notification by ID and include community name
router.get("/notifications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        community: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    return sendResponse(
      res,
      { ...notification, communityName: notification.community.name },
      0,
      "Success",
      "success",
      ""
    );
  } catch (exception) {
    console.error(exception);
    return sendResponse(
      res,
      null,
      500,
      "Error",
      "Something went wrong",
      exception.message
    );
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
