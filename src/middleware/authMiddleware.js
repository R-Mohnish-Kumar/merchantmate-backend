const { admin } = require("../config/firebase");
const { errorResponse } = require("../utils/response");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, 401, "Authorization token missing");
    }

    const idToken = authHeader.split("Bearer ")[1];

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || null,
    };

    next();
  } catch (error) {
    return errorResponse(res, 401, "Invalid or expired token", error);
  }
};

module.exports = authMiddleware;