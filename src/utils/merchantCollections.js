const { db } = require("../config/firebase");

const getMerchantRef = (merchantId) => {
  return db.collection("merchants").doc(merchantId);
};

const getMerchantProductsCollection = (merchantId) => {
  return getMerchantRef(merchantId).collection("products");
};

const getMerchantTransactionsCollection = (merchantId) => {
  return getMerchantRef(merchantId).collection("transactions");
};

const getMerchantProfileRef = (merchantId) => {
  return getMerchantRef(merchantId).collection("profile").doc("details");
};

module.exports = {
  getMerchantRef,
  getMerchantProductsCollection,
  getMerchantTransactionsCollection,
  getMerchantProfileRef,
};