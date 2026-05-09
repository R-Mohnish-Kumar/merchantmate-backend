const { db, admin } = require("../config/firebase");
const { successResponse, errorResponse } = require("../utils/response");
const {
  calculateCartTotals,
  generateReceiptId,
} = require("../utils/calculations");
const {
  getMerchantProductsCollection,
  getMerchantTransactionsCollection,
} = require("../utils/merchantCollections");

const validateCheckoutInput = (items, paymentMethod) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "Checkout items are required";
  }

  if (!paymentMethod || !["CARD", "CASH"].includes(paymentMethod)) {
    return "Payment method must be CARD or CASH";
  }

  for (const item of items) {
    if (!item.productId || !item.name || Number(item.quantity) <= 0) {
      return "Each item must include productId, name and valid quantity";
    }
  }

  return null;
};

const checkout = async (req, res) => {
  try {
    const merchantId = req.user.uid;
    const productsCollection = getMerchantProductsCollection(merchantId);
    const transactionsCollection = getMerchantTransactionsCollection(merchantId);

    const { items, paymentMethod } = req.body;

    const validationError = validateCheckoutInput(items, paymentMethod);

    if (validationError) {
      return errorResponse(res, 400, validationError);
    }

    const result = await db.runTransaction(async (transaction) => {
      const verifiedItems = [];

      for (const item of items) {
        const productRef = productsCollection.doc(item.productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const product = productDoc.data();
        const requestedQuantity = Number(item.quantity);

        if (Number(product.stock) < requestedQuantity) {
          throw new Error(`Not enough stock for ${product.name}`);
        }

        verifiedItems.push({
          productRef,
          productId: productDoc.id,
          name: product.name,
          price: Number(product.price),
          quantity: requestedQuantity,
          lineTotal: Number(product.price) * requestedQuantity,
          previousStock: Number(product.stock),
        });
      }

      const totals = calculateCartTotals(verifiedItems);
      const receiptId = generateReceiptId();

      const transactionData = {
        merchantId,
        receiptId,
        items: verifiedItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
        subtotal: totals.subtotal,
        tax: totals.tax,
        taxRate: totals.taxRate,
        total: totals.total,
        paymentMethod,
        status: "SUCCESS",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const transactionRef = transactionsCollection.doc();

      transaction.set(transactionRef, transactionData);

      verifiedItems.forEach((item) => {
        transaction.update(item.productRef, {
          stock: item.previousStock - item.quantity,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return {
        id: transactionRef.id,
        ...transactionData,
        createdAt: new Date().toISOString(),
      };
    });

    return successResponse(res, 201, "Checkout completed successfully", result);
  } catch (error) {
    return errorResponse(res, 500, "Checkout failed", error);
  }
};

module.exports = {
  checkout,
};