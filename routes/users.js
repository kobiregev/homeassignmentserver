const router = require('express').Router();
const User = require('../models/users')
const jwt = require('jsonwebtoken');
const secret = 'bla564a0sd';

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (username && password) {
        try {
            const user = await User.findOne({ username })
            //user exsists and password match 
            if (user && user.password === password) {
                //to add addresses
                const token = jwt.sign({ id: user._id, username: user.username }, secret, { expiresIn: "20m" })
                console.log(username + ' Signed In ' + new Date())
                res.status(200).json({ error: "false", token })
            } else {
                res.status(400).json({ error: true, msg: 'Wrong username or password.' })
            }
        } catch (error) {
            res.sendStatus(500)
        }
    } else {
        res.status(400).json({ error: true, msg: 'Missing some info.' })
    }
})
module.exports = router