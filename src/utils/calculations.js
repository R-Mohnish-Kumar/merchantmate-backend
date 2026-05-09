const getTaxRate = () => {
  const taxRate = Number(process.env.TAX_RATE || 0.2);
  return Number.isNaN(taxRate) ? 0.2 : taxRate;
};

const roundToTwo = (value) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const calculateCartTotals = (items) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.price) * Number(item.quantity);
  }, 0);

  const taxRate = getTaxRate();
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return {
    subtotal: roundToTwo(subtotal),
    tax: roundToTwo(tax),
    total: roundToTwo(total),
    taxRate,
  };
};

const generateReceiptId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `RCP-${timestamp}-${random}`;
};

module.exports = {
  calculateCartTotals,
  generateReceiptId,
  roundToTwo,
};