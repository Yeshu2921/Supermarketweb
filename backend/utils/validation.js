
const ALLOWED_ROLES = ["admin", "worker", "supplier"];

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone) {
  if (typeof phone !== "string") return null;

  const value = phone.trim();
  const digits = value.replace(/\D/g, "");

  // Ethiopian phone: 0912345678
  if (digits.startsWith("0") && digits.length === 10) {
    return "+251" + digits.slice(1);
  }

  // Ethiopian phone: 251912345678
  if (digits.startsWith("251") && digits.length === 12) {
    return "+" + digits;
  }

  // Ethiopian phone: 912345678
  if (digits.length === 9) {
    return "+251" + digits;
  }

  // International phone with a leading +
  if (
    value.startsWith("+") &&
    digits.length >= 7 &&
    digits.length <= 15
  ) {
    return "+" + digits;
  }

  return null;
}

function validEmail(email) {
  return (
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function validText(value, maxLength) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

function validateAddress(address) {
  return (
    address === undefined ||
    address === null ||
    (typeof address === "string" && address.trim().length <= 255)
  );
}

function validRole(role) {
  return ALLOWED_ROLES.includes(role);
}

function validPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 72
  );
}

module.exports = {
  ALLOWED_ROLES,
  normalizeEmail,
  normalizePhone,
  validEmail,
  validText,
  validateAddress,
  validRole,
  validPassword,
};
