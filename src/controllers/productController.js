const { admin } = require("../config/firebase");
const { successResponse, errorResponse } = require("../utils/response");
const {
  getMerchantProductsCollection,
} = require("../utils/merchantCollections");

const validateProductInput = ({ name, price, category, stock }) => {
  if (!name || typeof name !== "string") {
    return "Product name is required";
  }

  if (price === undefined || Number(price) <= 0) {
    return "Valid product price is required";
  }

  if (!category || typeof category !== "string") {
    return "Product category is required";
  }

  if (stock === undefined || Number(stock) < 0) {
    return "Valid product stock is required";
  }

  return null;
};

const getProducts = async (req, res) => {
  try {
    const merchantId = req.user.uid;
    const productsCollection = getMerchantProductsCollection(merchantId);

    const snapshot = await productsCollection.orderBy("createdAt", "desc").get();

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return successResponse(res, 200, "Products fetched successfully", products);
  } catch (error) {
    return errorResponse(res, 500, "Failed to fetch products", error);
  }
};

const createProduct = async (req, res) => {
  try {
    const merchantId = req.user.uid;
    const productsCollection = getMerchantProductsCollection(merchantId);

    const { name, price, category, stock } = req.body;

    const validationError = validateProductInput({
      name,
      price,
      category,
      stock,
    });

    if (validationError) {
      return errorResponse(res, 400, validationError);
    }

    const productData = {
      merchantId,
      name: name.trim(),
      price: Number(price),
      category: category.trim(),
      stock: Number(stock),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await productsCollection.add(productData);
    const createdDoc = await docRef.get();

    return successResponse(res, 201, "Product created successfully", {
      id: docRef.id,
      ...createdDoc.data(),
    });
  } catch (error) {
    return errorResponse(res, 500, "Failed to create product", error);
  }
};

const updateProduct = async (req, res) => {
  try {
    const merchantId = req.user.uid;
    const productsCollection = getMerchantProductsCollection(merchantId);

    const { id } = req.params;
    const { name, price, category, stock } = req.body;

    const docRef = productsCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return errorResponse(res, 404, "Product not found");
    }

    const validationError = validateProductInput({
      name,
      price,
      category,
      stock,
    });

    if (validationError) {
      return errorResponse(res, 400, validationError);
    }

    const updatedData = {
      name: name.trim(),
      price: Number(price),
      category: category.trim(),
      stock: Number(stock),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.update(updatedData);
    const updatedDoc = await docRef.get();

    return successResponse(res, 200, "Product updated successfully", {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    });
  } catch (error) {
    return errorResponse(res, 500, "Failed to update product", error);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const merchantId = req.user.uid;
    const productsCollection = getMerchantProductsCollection(merchantId);

    const { id } = req.params;

    const docRef = productsCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return errorResponse(res, 404, "Product not found");
    }

    await docRef.delete();

    return successResponse(res, 200, "Product deleted successfully", {
      id,
    });
  } catch (error) {
    return errorResponse(res, 500, "Failed to delete product", error);
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};