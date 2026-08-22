import { Resend } from 'resend';

// Use a placeholder key during build to prevent the constructor from throwing
export const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
