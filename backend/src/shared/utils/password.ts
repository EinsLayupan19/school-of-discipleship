import { randomInt } from "crypto";

// Excludes visually-ambiguous characters (0/O, 1/l/I) since these
// passwords are meant to be read aloud or typed by hand once.
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

/** Generates a random temporary password for a newly created account or a password reset. */
export function generateTempPassword(length = 14): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARSET[randomInt(CHARSET.length)];
  }
  return result;
}
