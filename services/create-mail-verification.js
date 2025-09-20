import "dotenv/config";
import nodemailer from 'nodemailer';

const FROM_EMAIL = process.env.PRIMARY_SMTP_FROM_EMAIL;
const PRIMARY_SMTP_SERVER = process.env.PRIMARY_SMTP_SERVER;
const PRIMARY_SMTP_PORT = process.env.PRIMARY_SMTP_PORT;
const PRIMARY_SMTP_USERNAME = process.env.PRIMARY_SMTP_USERNAME;
const PRIMARY_SMTP_PASSWORD = process.env.PRIMARY_SMTP_PASSWORD;

const transporter = nodemailer.createTransport({
  host: PRIMARY_SMTP_SERVER,
  port: Number(PRIMARY_SMTP_PORT),
  secure: true,
  auth: {
    user: PRIMARY_SMTP_USERNAME,
    pass: PRIMARY_SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Function to generate HTML content for verification email
const generateHtmlContent = (fullName, verificationCode) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2 style="color: #4CAF50;">Verify Your Email</h2>
    <p>Dear ${fullName || 'User'},</p>
    <p>Please verify your email by entering the verification code below:</p>
    <h1>${verificationCode}</h1>
    <p>This code will expire in 10 minutes.</p>
    <p>If you did not register for an account, please disregard this email.</p>
    <p>Best regards,</p>
    <p>Support Team</p>
  </div>
`;

export const sendVerificationEmail = async (username, verificationCode, fullName, subject) => {
  const htmlContent = generateHtmlContent(fullName, verificationCode);

  console.log('Sending verification email to: ', username, ' with code: ', verificationCode);

  const mailOptions = {
    from: `"Verification mails" <${FROM_EMAIL}>`,
    to: username,
    subject: subject || 'Verify your email',
    html: htmlContent,
  };

  // console.log('Sending email: ', mailOptions);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.response);
  } catch (error) {
    console.error('Error sending email: ', error);
    throw new Error('Failed to send verification email');
  }
};

export const sendRegistrationVerificationEmail = async (primaryEmail, verificationCode, fullName) => {
  const htmlContent = generateHtmlContent(fullName, verificationCode);

  console.log('Sending registration verification email to: ', primaryEmail, ' with code: ', verificationCode);

  const mailOptions = {
    from: `"Verification mails" <${FROM_EMAIL}>`,
    to: primaryEmail,
    subject: 'Verify your email',
    html: htmlContent,
  };

  try {
    // TODO: bug fix => uncomment the line below some vertion error
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.response);
  } catch (error) {
    console.error('Error sending email: ', error);
    throw new Error('Failed to send registration verification email');
  }
};
