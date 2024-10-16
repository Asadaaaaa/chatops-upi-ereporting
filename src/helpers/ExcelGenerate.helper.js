import exceljs from 'exceljs';

/**
 * Generates an Excel file from the provided columns and data.
 *
 * @param {string[]} columns - An array of column names.
 * @param {Object[]} datas - An array of data objects, where each object represents a row.
 * @example
 * const columns = ['Name', 'Age', 'Email'];
 * const datas = [
 *   [ 'John Doe', 30, 'john.doe@example.com' ],
 *   [ 'Jane Smith', 25, 'jane.smith@example.com' ]
 * ];
 * generateExcelFile(columns, datas);
 * @returns {Promise<string>} A string that contains the filepath when the Excel file has been saved.
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

  worksheet.columns.forEach(column => {
    const lengths = column.values.map(v => v.toString().length);
    const maxLength = Math.max(...lengths.filter(v => typeof v === 'number'));
    column.width = maxLength;
  });

  const filePath = process.cwd() + '/server_data/exported/' + Date.now() + '.xlsx';

  await workBook.xlsx.writeFile(filePath);

  return filePath;
}