const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Prisma of creating a new user
router.post('/register', [
    check('name').notEmpty(),
  check('email').isEmail(),
  check('password').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
  console.log(errors)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password, name, gender, phoneNumber } = req.body;

  const existingUser = await prisma.user.findUnique({
      where: { phoneNumber }
  });

  if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
      data: {
          email:email,
          password: hashedPassword,
          name,
          phoneNumber: phoneNumber,
          gender: gender           
      },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true
    }
  });
  
  res.status(201).json({ message: 'User registered successfully'});
});

// User Login Route
router.post('/login', async (req, res) => {
  const { email, password, phoneNumber } = req.body;
 try {
  // Find user by email
  const user = await prisma.user.findUnique({
      where: { phoneNumber }
  });
  // Exclude the password from the response
  const { password: _, ...userWithoutPassword } = user;

  if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ token: token,  user : userWithoutPassword });
} catch(error) {
    res.status(500).send(error);
}
});

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
