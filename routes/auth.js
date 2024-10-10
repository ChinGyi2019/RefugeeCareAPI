const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { sendResponse } = require("../utils/sendResponse");
// Prisma of creating a new user
router.post(
  "/register",
  [
    check("name").notEmpty(),
    check("email").isEmail(),
    check("phoneNumber").notEmpty(),
    check("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      console.log(errors);
      if (!errors.isEmpty()) {
        const errorMessage = errors
          .array()
          .map((error) => error.msg + " " + error.path)
          .join(", ");
        console.log(errorMessage);
        return sendResponse(
          (res = res),
          (data = null),
          (statusCode = 401),
          (title = "Error"),
          (message = "Please fill the require fields"),
          (identifier = errorMessage)
        );
      }

      const { email, password, name, phoneNumber } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (existingUser) {
        console.log("Error -> User already exists");
        return sendResponse(
          (res = res),
          (data = null),
          (statusCode = 401),
          (title = "Error"),
          (message = "User already exists"),
          (identifier = "User already exists")
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          name,
          phoneNumber: phoneNumber,
          //  gender: gender,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phoneNumber: true,
        },
      });
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "3y",
      });
      return sendResponse(
        (res = res),
        (data = {
          ...user,
          token: token,
        }),
        (statusCode = 0),
        (message = "User registered successfully"),
        (identifier = "USER_REGISTERED")
      );
      // res.status(201).json({
      //   data: {
      //     ...user,
      //     token: token,
      //   },
      //   statusCode: 0,
      //   message: "User registered successfully",
      //   identifier: "USER_REGISTERED",
      // });
      // res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error(error);
      return sendResponse(
        (res = res),
        (data = null),
        (statusCode = 500),
        (title = "Success"),
        (message = "Something went wrong"),
        (identifier = error)
      );
    }
  }
);
router.post(
  "/login",
  [
    check("password").isLength({ min: 6 }).withMessage("Password is too short"),
    check("phoneNumber").notEmpty().withMessage("Phone number is required"),
  ],
  async (req, res) => {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessage = errors
          .array()
          .map((error) => error.msg + " " + error.path)
          .join(", ");
        return sendResponse(
          res,
          null,
          401,
          "Error",
          "Please fill the required fields",
          errorMessage
        );
      }

      const { password, phoneNumber } = req.body;

      // Find user by phone number
      const user = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (!user) {
        return sendResponse(
          res,
          null,
          401,
          "Error",
          "Invalid credentials",
          "USER_NOT_FOUND"
        );
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return sendResponse(
          res,
          null,
          401,
          "Error",
          "Invalid credentials",
          "INVALID_PASSWORD"
        );
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "3y",
      });

      // Exclude password from user object
      const { password: _, ...userWithoutPassword } = user;

      // Return success response with user data and token
      return sendResponse(
        res,
        { ...userWithoutPassword, token: token },
        0,
        "Login successful",
        "USER_LOGGED_IN"
      );
    } catch (error) {
      console.error(error);
      return sendResponse(
        res,
        null,
        500,
        "Error",
        "Something went wrong",
        error.toString()
      );
    }
  }
);
// User Login Route
// router.post("/login", async (req, res) => {
//   const { email, password, phoneNumber } = req.body;
//   try {
//     // Find user by phone number
//     const user = await prisma.user.findUnique({
//       where: { phoneNumber },
//     });
//     // Exclude the password from the response
//     const { password: _, ...userWithoutPassword } = user;

//     if (!user) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     // Check password
//     const isValidPassword = await bcrypt.compare(password, user.password);

//     if (!isValidPassword) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     // Generate JWT
//     const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
//       expiresIn: "3y",
//     });

//     res.json({ token: token, user: userWithoutPassword });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send(error);
//   }
// });

// Register a new user
// router.post('/register', [
//   check('name').notEmpty(),
//   check('email').isEmail(),
//   check('password').isLength({ min: 6 })
// ], async (req, res) => {
//   const errors = validationResult(req);
//   console.log(errors)
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   const { name, email, password } = req.body;
//   try {
//     const hashedPassword = await bcrypt.hash(password, 8);
//     const user = new User({ name, email, password: hashedPassword });
//     await user.save();
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     res.status(201).json({
//         token, user
//      });
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

// // Login a user
// router.post('/login', [
//   check('email').isEmail(),
//   check('password').exists()
// ], async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).send({ error: 'Invalid email or password' });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).send({ error: 'Invalid email or password' });
//     }

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     res.json({ token });
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

module.exports = router;
