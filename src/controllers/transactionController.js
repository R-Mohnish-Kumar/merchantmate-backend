const { successResponse, errorResponse } = require("../utils/response");
const {
  getMerchantTransactionsCollection,
} = require("../utils/merchantCollections");

const getTransactions = async (req, res) => {
  try {
    const merchantId = req.user.uid;
    const transactionsCollection = getMerchantTransactionsCollection(merchantId);

    const snapshot = await transactionsCollection
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();

    const transactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return successResponse(
      res,
      200,
      "Transactions fetched successfully",
      transactions
    );
  } catch (error) {
    return errorResponse(res, 500, "Failed to fetch transactions", error);
  }
};

module.exports = {
  getTransactions,
};