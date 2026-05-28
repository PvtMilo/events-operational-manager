import ExcelJS from "exceljs";

const headerFill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F4E78" },
};

const cellBorder = {
  top: { style: "thin", color: { argb: "FFD9E2EC" } },
  left: { style: "thin", color: { argb: "FFD9E2EC" } },
  bottom: { style: "thin", color: { argb: "FFD9E2EC" } },
  right: { style: "thin", color: { argb: "FFD9E2EC" } },
};

function isDateHeader(header) {
  return header.toLowerCase().includes("date");
}

function parseDateString(value) {
  const match = value?.toString().match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function getCellValue(header, value) {
  if (value === null || value === undefined) return "";

  if (isDateHeader(header)) {
    return parseDateString(value) || value;
  }

  return value;
}

function getDisplayLength(value) {
  if (value === null || value === undefined) return 0;
  if (value instanceof Date) return 10;

  return String(value).length;
}

export async function createExcelBuffer({ sheetName, headers, rows }) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  const dateColumnIndexes = headers
    .map((header, index) => (isDateHeader(header) ? index + 1 : null))
    .filter(Boolean);

  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.addRow(headers);

  for (const row of rows) {
    worksheet.addRow(
      row.map((value, index) => {
        return getCellValue(headers[index], value);
      }),
    );
  }

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(rows.length + 1, 1), column: headers.length },
  };

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = cellBorder;
      cell.alignment = {
        vertical: "middle",
        horizontal: rowNumber === 1 ? "center" : "left",
        wrapText: true,
      };

      if (rowNumber === 1) {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = headerFill;
      }
    });
  });

  worksheet.getRow(1).height = 22;

  for (const columnIndex of dateColumnIndexes) {
    worksheet.getColumn(columnIndex).numFmt = "yyyy-mm-dd";
  }

  headers.forEach((header, index) => {
    const maxRowLength = rows.reduce((max, row) => {
      const value = getCellValue(header, row[index]);
      return Math.max(max, getDisplayLength(value));
    }, header.length);

    worksheet.getColumn(index + 1).width = Math.min(
      Math.max(maxRowLength + 2, 12),
      50,
    );
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
