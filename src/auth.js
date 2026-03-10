export const ALLOWED_EMAILS = [
  "ranjitha.vinay@swanthike.com",
  "dsvinay9@gmail.com",
  "kannadathi.swanthike@gmail.com"
];

export function isAllowedEmail(email) {
  return ALLOWED_EMAILS.includes((email || "").toLowerCase());
}