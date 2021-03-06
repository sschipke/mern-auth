const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const key = process.env.SECRET_OR_KEY;

const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

const User = require("../../models/User");

router.post("/register", (req, res) => {
  
  const { errors, isValid } = validateRegisterInput(req.body);

  if(!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    if(user) {
      return res.status(400).json({ email: "Email already exists."})
    } else {
      const { name, email, password } = req.body
      const newUser = new User({
        name,
        email,
        password
      });
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if(err) throw err;
          newUser.password = hash;
          newUser.save()
          .then(user => res.json(user))
          .catch(err => { 
            console.error(err)
            throw err });
        });
      });
    }
  });
});

router.post("/login", (req, res) => {
  const {errors, isValid } = validateLoginInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const { email, password } = req.body
  console.log('body!!: ->',req.body)

  User.findOne({ email }).then(user => {
    console.log('USER', user)
    if(!user) {
      return res.status(404).json({ emailnotfound: "Email not found"})
    }

    bcrypt.compare(password, user.password).then(isMatch => {
      if(isMatch) {
        const payload = {
          id: user.id,
          name: user.name
        };

        jwt.sign(
          payload,
          key,
          {
            expiresIn: 432000
          },
          (err, token) => {
            res.status(200).json({
              success: true,
              token: "Bearer " + token
            })
          }
        )
      } else {
        return res.status(400).json({ loginIncorrect: "Password or email incorrect"})
      }
    })
  })
})

module.exports = router;

