const { successResponse, errorResponse } = require("../utils/response");
const { roundToTwo } = require("../utils/calculations");
const {
  getMerchantProductsCollection,
  getMerchantTransactionsCollection,
} = require("../utils/merchantCollections");

const getStartOfDay = (daysAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getEndOfDay = (daysAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(23, 59, 59, 999);
  return date;
};

const getTransactionsForDay = async (transactionsCollection, daysAgo = 0) => {
  const start = getStartOfDay(daysAgo);
  const end = getEndOfDay(daysAgo);

  const snapshot = await transactionsCollection
    .where("createdAt", ">=", start)
    .where("createdAt", "<=", end)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

const getTodayInsights = async (req, res) => {
  try {
    const merchantId = req.user.uid;

    const productsCollection = getMerchantProductsCollection(merchantId);
    const transactionsCollection = getMerchantTransactionsCollection(merchantId);

    const lowStockThreshold = Number(process.env.LOW_STOCK_THRESHOLD || 5);

    const [productsSnapshot, todayTransactions, yesterdayTransactions] =
      await Promise.all([
        productsCollection.get(),
        getTransactionsForDay(transactionsCollection, 0),
        getTransactionsForDay(transactionsCollection, 1),
      ]);

    const products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const productSales = {};

    products.forEach((product) => {
      productSales[product.id] = {
        productId: product.id,
        name: product.name,
        quantitySold: 0,
        revenue: 0,
      };
    });

    todayTransactions.forEach((txn) => {
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

    const salesArray = Object.values(productSales);

    const topSeller =
      salesArray
        .filter((item) => item.quantitySold > 0)
        .sort((a, b) => b.quantitySold - a.quantitySold)[0] || null;

    const lowStock = products
      .filter((product) => Number(product.stock) <= lowStockThreshold)
      .map((product) => ({
        productId: product.id,
        productName: product.name,
        stock: Number(product.stock),
        message: `${product.name} stock is low. Only ${product.stock} left.`,
      }));

    const slowMoving = salesArray
      .filter((item) => item.quantitySold === 0)
      .map((item) => ({
        productId: item.productId,
        productName: item.name,
        message: `${item.name} has not sold today.`,
      }));

    const todayRevenue = todayTransactions.reduce(
      (sum, txn) => sum + Number(txn.total || 0),
      0
    );

    const yesterdayRevenue = yesterdayTransactions.reduce(
      (sum, txn) => sum + Number(txn.total || 0),
      0
    );

    let revenueComparisonMessage = "No sales comparison available yet.";
    let percentageChange = 0;

    if (yesterdayRevenue > 0) {
      percentageChange =
        ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;

      const direction = percentageChange >= 0 ? "higher" : "lower";

      revenueComparisonMessage = `Today's revenue is ${Math.abs(
        roundToTwo(percentageChange)
      )}% ${direction} than yesterday.`;
    } else if (todayRevenue > 0) {
      revenueComparisonMessage =
        "You have sales today, but there were no sales yesterday to compare.";
    }

    const averageOrderValue =
      todayTransactions.length === 0
        ? 0
        : todayRevenue / todayTransactions.length;

    const suggestedActions = [];

    if (topSeller) {
      suggestedActions.push(
        `${topSeller.name} is your top seller today with ${topSeller.quantitySold} units sold.`
      );
    }

    if (lowStock.length > 0) {
      suggestedActions.push(`Restock ${lowStock[0].productName} soon.`);
    }

    if (slowMoving.length > 0) {
      suggestedActions.push(
        `${slowMoving[0].productName} has no sales today. Consider a small promotion.`
      );
    }

    return successResponse(res, 200, "Insights fetched successfully", {
      topSeller: topSeller
        ? {
            productId: topSeller.productId,
            productName: topSeller.name,
            quantitySold: topSeller.quantitySold,
            revenue: roundToTwo(topSeller.revenue),
            message: `${topSeller.name} is your top-selling product today.`,
          }
        : null,
      lowStock,
      slowMoving,
      averageOrderValue: roundToTwo(averageOrderValue),
      revenueComparison: {
        todayRevenue: roundToTwo(todayRevenue),
        yesterdayRevenue: roundToTwo(yesterdayRevenue),
        percentageChange: roundToTwo(percentageChange),
        message: revenueComparisonMessage,
      },
      suggestedActions,
    });
  } catch (error) {
    return errorResponse(res, 500, "Failed to fetch insights", error);
  }
};

module.exports = {
  getTodayInsights,
};