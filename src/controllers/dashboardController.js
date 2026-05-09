const { successResponse, errorResponse } = require("../utils/response");
const { roundToTwo } = require("../utils/calculations");
const {
  getMerchantTransactionsCollection,
} = require("../utils/merchantCollections");

const getStartOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const getDashboardSummary = async (req, res) => {
  try {
    const merchantId = req.user.uid;
    const transactionsCollection = getMerchantTransactionsCollection(merchantId);

    const startOfToday = getStartOfToday();

    const snapshot = await transactionsCollection
      .where("createdAt", ">=", startOfToday)
      .get();

    const transactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const todayRevenue = transactions.reduce(
      (sum, txn) => sum + Number(txn.total || 0),
      0
    );

    const transactionCount = transactions.length;

    const averageOrderValue =
      transactionCount === 0 ? 0 : todayRevenue / transactionCount;

    const productSales = {};

    transactions.forEach((txn) => {
      (txn.items || []).forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            name: item.name,
            quantitySold: 0,
            revenue: 0,
          };
        }

        productSales[item.productId].quantitySold += Number(item.quantity);
        productSales[item.productId].revenue += Number(item.lineTotal);
      });
    });

    const bestSellingProduct =
      Object.values(productSales).sort(
        (a, b) => b.quantitySold - a.quantitySold
      )[0] || null;

    const recentTransactions = transactions
      .sort((a, b) => {
        const dateA = a.createdAt?._seconds || 0;
        const dateB = b.createdAt?._seconds || 0;
        return dateB - dateA;
      })
      .slice(0, 5)
      .map((txn) => ({
        id: txn.id,
        receiptId: txn.receiptId,
        total: txn.total,
        paymentMethod: txn.paymentMethod,
        status: txn.status,
        createdAt: txn.createdAt,
      }));

    return successResponse(res, 200, "Dashboard summary fetched successfully", {
      todayRevenue: roundToTwo(todayRevenue),
      transactionCount,
      averageOrderValue: roundToTwo(averageOrderValue),
      bestSellingProduct,
      recentTransactions,
    });
  } catch (error) {
    return errorResponse(res, 500, "Failed to fetch dashboard summary", error);
  }
};

module.exports = {
  getDashboardSummary,
};