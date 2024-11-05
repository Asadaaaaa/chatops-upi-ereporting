import exceljs from 'exceljs';
import {convertCurrency, convertDate} from "./Converter.helper.js";

/**
 * Generates an Excel file from the provided columns and data.
 *
 * @param {string[]} columns - An array of column names.
 * @param {Object[]} datas - An array of data objects, where each object represents a row.
 * @param {Object} header - An object of header, where each key represents a header.
 * @param {string} sheetName - A string for worksheet name.
 * @example
 * const columns = ['Name', 'Age', 'Email'];
 * const datas = [
 *   [ 'John Doe', 30, 'john.doe@example.com' ],
 *   [ 'Jane Smith', 25, 'jane.smith@example.com' ]
 * ];
 * generateExcelFile(columns, datas);
 * @returns {Promise<string>} A string that contains the filepath when the Excel file has been saved.
 */

export const genereateExcel = async (columns, datas, header, sheetName) => {
  const workBook = new exceljs.Workbook();
  const worksheet = workBook.addWorksheet(sheetName);
  const columnScheme = [];

  for (let i in columns) {
    const originalColumn = columns[i];
    if (header[originalColumn]) {
      const customHeader = header[originalColumn]
      const key = originalColumn.toLowerCase().replace(' ', '_');
      columnScheme.push({ header: customHeader, key: key, width: 10 });
    }
  }

  worksheet.columns = columnScheme;

  for(let i in datas) {
    let data = {};
    for(let j in columns) {
      if (header[columns[j]]) {
        let key = columns[j].toLowerCase().replace(' ', '_');
        let value = datas[i][j];
        if (key.startsWith('waktu') || key.startsWith('tanggal')) {
          value = convertDate(value);
        }
        if (key.startsWith('jumlah_dana')) {
          value = convertCurrency(value);
        }
        data[key] = value;
      }
    }
    
    worksheet.addRow(data);
  }

  worksheet.columns.forEach(column => {
    const lengths = column.values.map(v => v.toString().length);
    const maxLength = Math.max(...lengths.filter(v => typeof v === 'number'));
    column.width = maxLength;
  });

  const filePath = process.cwd() + '/server_data/exported/' + Date.now() + '.xlsx';

  await workBook.xlsx.writeFile(filePath);

  return filePath;
}