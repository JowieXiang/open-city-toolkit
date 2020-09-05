const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')


function initialize(passport, getUserByEmail, getUserById) {
  // done用于给req加入user属性
  const verifyCallback = async (email, password, done) => {
    const user = await getUserByEmail(email)
    console.log("user!!!", user)
    console.log("user!!!", user.password)
    console.log("user!!!", password)
    


    if (user == null) {
      return done(null, false, { message: 'No user with that email' })
    }
    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Password incorrect' })
      }
    } catch (e) {
      return done(e)
    }
  }

  // confirm the authentication strategy that passport uses
  passport.use(new LocalStrategy({ usernameField: 'email' }, verifyCallback))
  // confirm serialization strategy that passport uses
  passport.serializeUser((user, done) => done(null, user.id))
  // confirm deserialization strategy that passport uses
  passport.deserializeUser(async (id, done) => {
    const user = await getUserById(id)
    return done(null, user)
  })
}

module.exports = initialize