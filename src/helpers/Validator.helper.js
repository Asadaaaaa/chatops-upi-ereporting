import validator from "validator";
import moment from "moment";

/**
 * Validate a date string is in DD MMMM YYYY format.
 *
 * @param {string} input - A string that contain a date.
 * const input = "1 Januari 2024";
 * validateDate(input);
 * @returns boolean return boolean that confirm the string is date or not.
 */
export const validateDate = (input) => {
  moment.locale('id');
  const date = moment(input, ['DD MMMM YYYY', 'D MMMM YYYY'], true);

  return date.isValid();
}

/**
 * Validate a Student ID string is in 7 digit format.
 *
 * @param {string} input - A string that contain student ID.
 * const input = "1234567";
 * validateNim(input);
 * @returns boolean return boolean that confirm the string is a valid student ID or not.
 */
export const validateNim = (input) => {
  return validator.isNumeric(input) && input.length === 7;
}

/**
 * Validate a year string is in YYYY format.
 *
 * @param {string} input - A string that contain year.
 * const input = "2024";
 * validateYear(input);
 * @returns boolean return boolean that confirm the string is a valid year or not.
 */
export const validateYear = (input) => {
  moment.locale('id');
  const date = moment(input, 'YYYY', true);

  return date.isValid();
}
/**
 * Validate a currency string is in indonesian format.
 *
 * @param {string} input - A string that contain currency.
 * const input = "1.000.000";
 * validateCurrency(input);
 * @returns boolean return boolean that confirm the string is a valid currency format or not.
 */
export const validateCurrency = (input) => {
  const currencyRegex = /^\d{1,3}(?:\.\d{3})*$/;

  return currencyRegex.test(input);
}

