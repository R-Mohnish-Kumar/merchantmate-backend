const admin = require("firebase-admin");

const getProfile = async (req, res) => {
  try {
    const merchantId = req.user.uid;
    const email = req.user.email || "";

    const merchantRef = admin.firestore()
      .collection("merchants")
      .doc(merchantId);

    const doc = await merchantRef.get();

    if (!doc.exists) {
      const defaultProfile = {
        merchantId,
        shopName: "",
        ownerName: "",
        email,
        contactNumber: "",
        shopAddress: "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await merchantRef.set(defaultProfile, { merge: true });

      return res.status(200).json({
        success: true,
        message: "Profile created successfully",
        data: {
          merchantId,
          shopName: "",
          ownerName: "",
          email,
          contactNumber: "",
          shopAddress: "",
          createdAt: null,
          updatedAt: null
        }
      });
    }

    const profile = doc.data();

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: {
        merchantId,
        email,
        ...profile
      }
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const merchantId = req.user.uid;
    const email = req.user.email || "";

    const {
      shopName,
      ownerName,
      contactNumber,
      shopAddress
    } = req.body;

    if (!shopName || !ownerName || !contactNumber || !shopAddress) {
      return res.status(400).json({
        success: false,
        message: "Shop name, owner name, contact number and shop address are required"
      });
    }

    const merchantRef = admin.firestore()
      .collection("merchants")
      .doc(merchantId);

    const doc = await merchantRef.get();

    const profileData = {
      merchantId,
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      email,
      contactNumber: contactNumber.trim(),
      shopAddress: shopAddress.trim(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (!doc.exists) {
      profileData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await merchantRef.set(profileData, { merge: true });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        merchantId,
        shopName: profileData.shopName,
        ownerName: profileData.ownerName,
        email: profileData.email,
        contactNumber: profileData.contactNumber,
        shopAddress: profileData.shopAddress,
        createdAt: null,
        updatedAt: null
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile
};