//find Token from cookie and then find user from token

import jwt from "jsonwebtoken";

const userAuth = async(req,res,next) => {
       const {token} = req.cookies;

       if(!token){
        return res.json({success: false, message: 'Not Authorized Login Again'});
       }

    //    if token is available
    try{
      
    //   to decode token we use jwt
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    if(tokenDecode.id){
        if (!req.body) req.body = {};  // ensure req.body exists
        req.userId = tokenDecode.id
    }
    else{
        return res.json({success: false, message: 'Not Authorized Login Again'});
    }

    next();

    }
    catch(error){
        return res.json({success: false, message: error.message});
    }
}


export default userAuth;