import exceljs from 'exceljs';

/**
 * Generates an Excel file from the provided columns and data.
 *
 * @param {string[]} columns - An array of column names.
 * @param {Object[]} datas - An array of data objects, where each object represents a row.
 * @example
 * const columns = ['Name', 'Age', 'Email'];
 * const datas = [
 *   { Name: 'John Doe', Age: 30, Email: 'john.doe@example.com' },
 *   { Name: 'Jane Smith', Age: 25, Email: 'jane.smith@example.com' }
 * ];
 * generateExcelFile(columns, datas);
 * @returns {Promise<void>} A promise that resolves when the Excel file has been written.
 */

export const genereateExcel = async (columns, datas) => {
  const workBook = new exceljs.Workbook();
  const worksheet = workBook.addWorksheet('Sheet1');
  const columnScheme = [];

  for(let i in columns) {
    let key = columns[i].toLowerCase().replace(' ', '_');
    columnScheme.push({ header: columns[i], key: key, width: 10 });
  }

  worksheet.columns = columnScheme;

  for(let i in datas) {
    let data = {};
    for(let j in columns) {
      let key = columns[j].toLowerCase().replace(' ', '_');
      data[key] = datas[i][j];
    }
    
    worksheet.addRow(data);
  }

  const filePath = process.cwd() + '/server_data/exported/' + Date.now() + '.xlsx';

  await workBook.xlsx.writeFile(filePath);
}