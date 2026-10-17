
function handleError(error, res) {
  if (error.code === "ER_DUP_ENTRY") {
    const detail = String(error.message || "").toLowerCase();

    if (detail.includes("email")) {
      return res.status(409).json({
        message: "This email is already registered.",
        field: "email",
      });
    }

    if (
      detail.includes("phone") ||
      detail.includes("unique_users_phone")
    ) {
      return res.status(409).json({
        message: "This phone number is already registered.",
        field: "phone",
      });
    }

    return res.status(409).json({
      message: "This information already exists.",
    });
  }

  console.error("API error:", error.message);

  return res.status(500).json({
    message: "A server error occurred. Please try again.",
  });
}

module.exports = handleError;
