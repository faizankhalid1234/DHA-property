import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import Property from '../models/Property.js';
import Customer from '../models/Customer.js';
import Transfer from '../models/Transfer.js';
import Case from '../models/Case.js';
import OwnershipHistory from '../models/OwnershipHistory.js';
import { asyncHandler } from '../middleware/validate.js';

const sendPDF = (res, filename, buildFn) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  buildFn(doc);
  doc.end();
};

export const exportPropertyReport = asyncHandler(async (req, res) => {
  const { format = 'pdf' } = req.query;
  const properties = await Property.find()
    .populate('currentOwner', 'fullName cnic')
    .sort({ blockName: 1, propertyNumber: 1 });

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Properties');
    sheet.columns = [
      { header: 'Property ID', key: 'propertyId', width: 15 },
      { header: 'Number', key: 'propertyNumber', width: 12 },
      { header: 'Type', key: 'propertyType', width: 12 },
      { header: 'Block', key: 'blockName', width: 15 },
      { header: 'Sector', key: 'sectorName', width: 12 },
      { header: 'Size', key: 'plotSize', width: 12 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Owner', key: 'owner', width: 25 },
    ];
    properties.forEach((p) => {
      sheet.addRow({
        propertyId: p.propertyId,
        propertyNumber: p.propertyNumber,
        propertyType: p.propertyType,
        blockName: p.blockName,
        sectorName: p.sectorName,
        plotSize: p.plotSize,
        price: p.price,
        status: p.status,
        owner: p.ownerName || 'Unassigned',
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=property-report.xlsx');
    await workbook.xlsx.write(res);
    return;
  }

  sendPDF(res, 'property-report.pdf', (doc) => {
    doc.fontSize(20).fillColor('#1e3a8a').text('DHA Housing Scheme - Property Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#000');
    properties.forEach((p, i) => {
      doc.text(
        `${i + 1}. ${p.propertyId} | ${p.propertyNumber} | ${p.blockName} | ${p.status} | ${p.ownerName || 'Unassigned'}`
      );
    });
  });
});

export const exportCustomerReport = asyncHandler(async (req, res) => {
  const { format = 'pdf' } = req.query;
  const customers = await Customer.find().populate('properties').sort({ fullName: 1 });

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Customers');
    sheet.columns = [
      { header: 'Name', key: 'fullName', width: 25 },
      { header: 'CNIC', key: 'cnic', width: 18 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Properties', key: 'propertyCount', width: 12 },
      { header: 'Verified', key: 'verified', width: 10 },
    ];
    customers.forEach((c) => {
      sheet.addRow({
        fullName: c.fullName,
        cnic: c.cnic,
        phone: c.phone,
        email: c.email,
        propertyCount: c.properties?.length || 0,
        verified: c.isVerified ? 'Yes' : 'No',
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=customer-report.xlsx');
    await workbook.xlsx.write(res);
    return;
  }

  sendPDF(res, 'customer-report.pdf', (doc) => {
    doc.fontSize(20).fillColor('#1e3a8a').text('DHA Housing Scheme - Customer Report', { align: 'center' });
    doc.moveDown();
    customers.forEach((c, i) => {
      doc.fontSize(10).text(`${i + 1}. ${c.fullName} | ${c.cnic} | ${c.properties?.length || 0} properties`);
    });
  });
});

export const exportTransferReport = asyncHandler(async (req, res) => {
  const transfers = await Transfer.find()
    .populate('property', 'propertyNumber blockName')
    .sort({ createdAt: -1 });

  sendPDF(res, 'transfer-report.pdf', (doc) => {
    doc.fontSize(20).fillColor('#1e3a8a').text('DHA Housing Scheme - Transfer Report', { align: 'center' });
    doc.moveDown();
    transfers.forEach((t, i) => {
      doc.fontSize(10).text(
        `${i + 1}. ${t.transferNumber} | ${t.property?.propertyNumber} | ${t.previousOwnerName} → ${t.newOwnerName}`
      );
    });
  });
});

export const exportCaseReport = asyncHandler(async (req, res) => {
  const cases = await Case.find().populate('property', 'propertyNumber').sort({ createdAt: -1 });

  sendPDF(res, 'case-report.pdf', (doc) => {
    doc.fontSize(20).fillColor('#1e3a8a').text('DHA Housing Scheme - Case Report', { align: 'center' });
    doc.moveDown();
    cases.forEach((c, i) => {
      doc.fontSize(10).text(`${i + 1}. ${c.caseNumber} | ${c.title} | ${c.status}`);
    });
  });
});

export const exportOwnershipReport = asyncHandler(async (req, res) => {
  const history = await OwnershipHistory.find()
    .populate('property', 'propertyNumber blockName')
    .populate('customer', 'fullName cnic')
    .sort({ createdAt: -1 });

  sendPDF(res, 'ownership-report.pdf', (doc) => {
    doc.fontSize(20).fillColor('#1e3a8a').text('DHA Housing Scheme - Ownership History', { align: 'center' });
    doc.moveDown();
    history.forEach((h, i) => {
      doc.fontSize(10).text(
        `${i + 1}. ${h.property?.propertyNumber} | ${h.ownerName} | ${h.action} | ${new Date(h.createdAt).toLocaleDateString()}`
      );
    });
  });
});

export const exportRevenueReport = asyncHandler(async (req, res) => {
  const revenue = await Property.aggregate([
    { $match: { status: { $in: ['active', 'inactive'] } } },
    {
      $group: {
        _id: '$blockName',
        totalRevenue: { $sum: '$price' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  sendPDF(res, 'revenue-report.pdf', (doc) => {
    doc.fontSize(20).fillColor('#1e3a8a').text('DHA Housing Scheme - Revenue Report', { align: 'center' });
    doc.moveDown();
    let grandTotal = 0;
    revenue.forEach((r, i) => {
      grandTotal += r.totalRevenue;
      doc.fontSize(10).text(`${i + 1}. ${r._id} | ${r.count} properties | PKR ${r.totalRevenue.toLocaleString()}`);
    });
    doc.moveDown();
    doc.fontSize(12).fillColor('#d4af37').text(`Grand Total: PKR ${grandTotal.toLocaleString()}`);
  });
});
