import moment from "moment";
import {validateCurrency, validateDate} from "./Validator.helper.js";

/**
 * Convert a date string from DD MMMM YYYY to YYYY-MM-DD format.
 *
 * @param {string} input - A string that contain a date.
 * const input = "1 Januari 2024";
 * convertDate(input);
 * @returns string return formatted string.
 */
export const convertDate = (input) => {
  if (!validateDate(input)) return input;

  moment.locale('id');
  const date = moment(input, ['DD MMMM YYYY', 'D MMMM YYYY'], true);

  return date.format('YYYY-MM-DD');
}

/**
 * Convert a currency string to integer.
 *
 * @param {string} input - A string that contain currency.
 * const input = "1.000.000";
 * convertCurrency(input);
 * @returns number|string return number or string.
 */
export const convertCurrency = (input) => {
  return parseInt(input.replace(/\./g, ""), 10);
}

