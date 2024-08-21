const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient(); // assuming your Prisma client is set up here
const auth = require("../middleware/auth"); // middleware for authentication
const router = express.Router();

// Create User
router.post(
  "/user",
  [
    body("phoneNumber").isMobilePhone().withMessage("Invalid phone number"),
    body("email").isEmail().withMessage("Invalid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneNumber, email, password, name, gender } = req.body;

    try {
      // Check if user already exists
      let user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        return res.status(400).json({ msg: "User already exists" });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      user = await prisma.user.create({
        data: {
          phoneNumber,
          email,
          password: hashedPassword,
          name,
          gender,
        },
      });

      // Generate JWT token
      const payload = {
        user: { id: user.id },
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.json({ token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// Get User by ID
router.get("/user/:id", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      // include: { roles: true, profile: true },
    });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Update User
router.put(
  "/user/:id",
  auth,
  [
    body("email").optional().isEmail().withMessage("Invalid email"),
    body("phoneNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Invalid phone number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneNumber, email, name, gender, password } = req.body;
    const userId = req.params.id;

    try {
      // Find user by ID
      let user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      // Update the user data
      const updatedData = { phoneNumber, email, name, gender };

      if (password) {
        const salt = await bcrypt.genSalt(10);
        updatedData.password = await bcrypt.hash(password, salt);
      }

      user = await prisma.user.update({
        where: { id: userId },
        data: updatedData,
      });

      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// Delete User
router.delete("/user/:id", auth, async (req, res) => {
  try {
    const userId = req.params.id;

    // Find user by ID
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Delete the user
    await prisma.user.delete({ where: { id: userId } });

    res.json({ msg: "User deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
