// ================= PREMIUM SETTINGS =================
// Change these before publishing.
const UPI_ID = "YOUR_UPI_ID@upi";
const PROMO_CODE = "YOURPROMO2026"; // Change this to the code you will give customers.
const WHATSAPP_NUMBER = "916900365026"; // International format, no + or spaces.
// =====================================================

const ACCESS_KEY = "examywebPremiumAccess";
const upiText = document.getElementById("upiText");
const upiBtn = document.getElementById("upiBtn");
const waBtn = document.getElementById("waBtn");
const receipt = document.getElementById("receipt");
const shareBtn = document.getElementById("shareBtn");
const promo = document.getElementById("promo");
const unlockBtn = document.getElementById("unlockBtn");
const status = document.getElementById("status");

upiText.textContent = UPI_ID;
upiBtn.href = "upi://pay?pa=" + encodeURIComponent(UPI_ID) +
  "&pn=" + encodeURIComponent("EXAMYWEB Premium") +
  "&am=49&cu=INR&tn=" + encodeURIComponent("EXAMYWEB Premium Tracker - 1 Year");

const waMessage = "Hi, I have paid ₹49 for the EXAMYWEB Premium Tracker. I am sharing my payment screenshot for verification.";
waBtn.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(waMessage);

function showStatus(message, ok) {
  status.textContent = message;
  status.className = "status show " + (ok ? "ok" : "err");
}

shareBtn.addEventListener("click", async () => {
  const file = receipt.files && receipt.files[0];
  try {
    if (file && navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
      await navigator.share({
        files: [file],
        title: "EXAMYWEB Payment Screenshot",
        text: waMessage
      });
      showStatus("Share sheet opened. Choose WhatsApp.", true);
      return;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;
  }
  window.open(waBtn.href, "_blank", "noopener,noreferrer");
  showStatus("WhatsApp opened. Attach your screenshot manually.", true);
});

unlockBtn.addEventListener("click", () => {
  const entered = promo.value.trim();
  if (!entered) {
    showStatus("Please enter your promo code.", false);
    return;
  }
  if (entered.toUpperCase() !== PROMO_CODE.toUpperCase()) {
    showStatus("Invalid promo code. Please check the code and try again.", false);
    return;
  }

  const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
  localStorage.setItem(ACCESS_KEY, JSON.stringify({
    activatedAt: Date.now(),
    expiresAt: expiresAt,
    plan: "premium-yearly"
  }));

  showStatus("Payment access verified. Opening your Premium Tracker…", true);
  setTimeout(() => {
    window.location.href = "djjdjdjd.html";
  }, 700);
});
