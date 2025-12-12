/**
 * DEPRECATED: Email sending has been moved to the Django backend.
 * 
 * Email functionality is now handled by the backend at:
 * - POST /api/auth/register/ (sends welcome email)
 * - POST /api/cards/save/ (sends first save email)
 * 
 * This file is kept for reference only and should not be used.
 */

export function sendWelcomeEmail() {
  console.warn('sendWelcomeEmail: Email sending is now handled by the Django backend');
}

export function sendFirstSaveEmail() {
  console.warn('sendFirstSaveEmail: Email sending is now handled by the Django backend');
}
