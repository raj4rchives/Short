(function () {
  // Premium gate. The real promo code is configured in payment.js.
  // This front-end gate is suitable for a static demo. For secure paid access,
  // validate payments/promo codes on a server.
  const KEY = "examywebPremiumAccess";
  const data = JSON.parse(localStorage.getItem(KEY) || "null");
  const valid = data && data.expiresAt && Date.now() < Number(data.expiresAt);
  if (!valid) {
    localStorage.removeItem(KEY);
    window.location.replace("payment.html?required=1");
  }
})();