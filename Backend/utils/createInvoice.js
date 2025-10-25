import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createInvoice = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Company Information
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('MERN ART GALLERY', 50, 50)
        .fontSize(10)
        .font('Helvetica')
        .text('123 Art Street, Creative District', 50, 75)
        .text('Mumbai, Maharashtra 400001', 50, 90)
        .text('India', 50, 105)
        .text('Email: info@mernart.com | Phone: +91 9876543210', 50, 120);

      // Invoice Title
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('INVOICE', 400, 50, { align: 'right' })
        .fontSize(10)
        .font('Helvetica')
        .text(`Order #: ${order.orderNumber}`, 400, 75, { align: 'right' })
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 90, { align: 'right' });

      // Customer Information
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('BILL TO:', 50, 160)
        .font('Helvetica')
        .fontSize(10)
        .text(order.user.name, 50, 180)
        .text(order.shippingAddress.street, 50, 195)
        .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`, 50, 210)
        .text(order.shippingAddress.country, 50, 225)
        .text(`Phone: ${order.shippingAddress.phoneNo}`, 50, 240);

      // Shipping Information
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('SHIP TO:', 250, 160)
        .font('Helvetica')
        .fontSize(10)
        .text(order.user.name, 250, 180)
        .text(order.shippingAddress.street, 250, 195)
        .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`, 250, 210)
        .text(order.shippingAddress.country, 250, 225)
        .text(`Phone: ${order.shippingAddress.phoneNo}`, 250, 240);

      // Line separator
      doc
        .moveTo(50, 270)
        .lineTo(550, 270)
        .stroke();

      // Table Header
      const tableTop = 290;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('ITEM', 50, tableTop)
        .text('QUANTITY', 300, tableTop)
        .text('PRICE', 400, tableTop)
        .text('AMOUNT', 500, tableTop, { align: 'right' });

      // Line under header
      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Table Rows
      let position = tableTop + 30;
      order.items.forEach((item, index) => {
        if (position > 700) {
          doc.addPage();
          position = 50;
        }

        doc
          .font('Helvetica')
          .fontSize(9)
          .text(item.name, 50, position, { width: 240 })
          .text(item.quantity.toString(), 300, position)
          .text(`$${item.priceAtOrder.toFixed(2)}`, 400, position)
          .text(`$${(item.priceAtOrder * item.quantity).toFixed(2)}`, 500, position, { align: 'right' });

        // Artist and medium info
        doc
          .fontSize(8)
          .fillColor('#666')
          .text(`by ${item.author} | ${item.medium}`, 50, position + 12)
          .fillColor('#000');

        position += 35;
      });

      // Line before totals
      doc
        .moveTo(50, position + 10)
        .lineTo(550, position + 10)
        .stroke();

      // Totals
      position += 30;
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Subtotal:', 400, position)
        .text(`$${order.subtotal.toFixed(2)}`, 500, position, { align: 'right' });

      position += 15;
      doc
        .text('Shipping:', 400, position)
        .text(`$${order.shippingCost.toFixed(2)}`, 500, position, { align: 'right' });

      if (order.discountAmount > 0) {
        position += 15;
        doc
          .text('Discount:', 400, position)
          .text(`-$${order.discountAmount.toFixed(2)}`, 500, position, { align: 'right' });
      }

      position += 20;
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('TOTAL:', 400, position)
        .text(`$${order.totalAmount.toFixed(2)}`, 500, position, { align: 'right' });

      // Payment method
      position += 25;
      doc
        .font('Helvetica')
        .fontSize(9)
        .text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, 50, position)
        .text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 50, position + 12)
        .text(`Order Status: ${order.orderStatus.toUpperCase()}`, 50, position + 24);

      // Footer
      const footerY = 750;
      doc
        .fontSize(8)
        .fillColor('#666')
        .text('Thank you for your purchase!', 50, footerY, { align: 'center', width: 500 })
        .text('MERN ART GALLERY - Bringing art to your doorstep', 50, footerY + 12, { align: 'center', width: 500 })
        .text('For any queries, contact us at support@mernart.com', 50, footerY + 24, { align: 'center', width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};