import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  async sendEmail(email: string, subject: string, code: string): Promise<any> {
    try {
      const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const info = await transport.sendMail({
        from: 'Nadych <fsklever@gmail.com>',
        to: email,
        subject: subject,
        html: `<h1>Thank for your registration</h1>
        <p>To finish registration please follow the link below:
            <a href='https://somesite.com/confirm-email?code=${code}'>complete registration</a>
        </p>`,
      });

      return info;
    } catch (e) {
      console.log('error from email:', e);
    }
  }

  async sendEmailWithRecoveryCode(
    email: string,
    recoveryCode: string,
  ): Promise<any> {
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const info = await transport.sendMail({
      from: 'Nadych <fsklever@gmail.com>',
      to: email,
      html: ` <h1>Password recovery</h1>
        <p>To finish password recovery please follow the link below:
           <a href='https://somesite.com/password-recovery?recoveryCode=${recoveryCode}'>recovery password</a>
       </p>`,
    });

    return info;
  }
}
