import sgMail from '@sendgrid/mail';

const initSendGrid = () => {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY is not defined in environment variables");
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
};

/**
 * Generic email sender
 */
export const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    initSendGrid();

    if (!process.env.EMAIL_FROM) {
      throw new Error("EMAIL_FROM is not defined in environment variables");
    }

    const msg = {
      to,
      from: process.env.EMAIL_FROM, // must be verified sender
      subject,
      html,
      attachments: attachments.map(a => ({
        content: a.content.toString("base64"),
        filename: a.filename,
        type: "application/pdf",
        disposition: "attachment",
      })),
    };

    const [response] = await sgMail.send(msg);

    console.log("📧 SendGrid accepted email:", response.statusCode);

    return {
      success: true,
      messageId: response.headers["x-message-id"],
    };
  } catch (error) {
    console.error("❌ SendGrid error:", error.response?.body || error.message);

    return {
      success: false,
      error: error.response?.body?.errors?.[0]?.message || error.message,
    };
  }
};

// Enhanced OTP Email with better styling
export const sendOTPEmail = async (email, otp) => {
  const subject = "Your OTP for MERN Art Gallery Verification";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-code { background: #fff; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; border: 2px dashed #667eea; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MERN Art Gallery</h1>
          <p>Email Verification</p>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Hello,</p>
          <p>Thank you for registering with MERN Art Gallery. Use the OTP below to verify your email address:</p>
          
          <div class="otp-code">${otp}</div>
          
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          
          <div class="footer">
            <p>MERN Art Gallery<br>123 Art Street, Creative District<br>Email: support@mernart.com</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

// Enhanced Password Reset Email
export const sendPasswordResetEmail = async (email, resetToken) => {
  const subject = "Password Reset Request - MERN Art Gallery";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .reset-code { background: #fff; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0; border-radius: 5px; border: 2px dashed #667eea; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MERN Art Gallery</h1>
          <p>Password Reset</p>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>Hello,</p>
          <p>You requested to reset your password. Use the OTP below to reset your password:</p>
          
          <div class="reset-code">${resetToken}</div>
          
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
          
          <div class="footer">
            <p>MERN Art Gallery<br>123 Art Street, Creative District<br>Email: support@mernart.com</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

// Order Confirmation Email with Invoice
export const sendOrderConfirmationEmail = async (order, invoiceBuffer) => {
  const subject = `Order Confirmation - #${order.orderNumber}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .order-summary { background: #fff; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #667eea; }
        .item { display: flex; justify-content: between; margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MERN Art Gallery</h1>
          <p>Order Confirmation</p>
        </div>
        <div class="content">
          <h2>Thank you for your order, ${order.user.name}!</h2>
          <p>Your order <strong>#${
            order.orderNumber
          }</strong> has been received and is being processed.</p>
          
          <div class="order-summary">
            <h3>Order Summary</h3>
            <p><strong>Order Number:</strong> #${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(
              order.createdAt
            ).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(
              2
            )}</p>
            <p><strong>Shipping Address:</strong><br>
            ${order.shippingAddress.street},<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${
    order.shippingAddress.zipCode
  }<br>
            ${order.shippingAddress.country}
            </p>
          </div>
          
          <p><strong>Order Items:</strong></p>
          ${order.items
            .map(
              (item) => `
            <div class="item">
              <div style="flex: 1;">
                <strong>${item.name}</strong><br>
                <small>by ${item.author} • ${item.medium}</small>
              </div>
              <div style="text-align: right;">
                $${item.priceAtOrder.toFixed(2)} × ${item.quantity}
              </div>
            </div>
          `
            )
            .join("")}
          
          <p style="margin-top: 20px;">Your invoice is attached to this email. You can also track your order status from your account dashboard.</p>
          <p>Thank you for choosing MERN Art Gallery!</p>
          
          <div class="footer">
            <p>MERN Art Gallery<br>123 Art Street, Creative District<br>Email: support@mernart.com | Phone: +91 9876543210</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const attachments = invoiceBuffer
    ? [
        {
          filename: `invoice-${order.orderNumber}.pdf`,
          content: invoiceBuffer,
        },
      ]
    : [];

  return await sendEmail(order.user.email, subject, html, attachments);
};