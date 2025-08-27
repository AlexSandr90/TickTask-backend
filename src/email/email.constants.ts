export const EMAIL_TEMPLATES = {
  VERIFICATION: {
    TITLE: 'Your Magic Link',
    CONTENT: `
      <p>Hello!</p>
      <p>We received a request to create an account for you. Click the button below to activate your account and get started:</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
    BUTTON_TEXT: 'Activate Your Account',
    BUTTON_TYPE: 'success' as const,
  },
  EMAIL_RESET: {
    TITLE: 'Email Reset',
    CONTENT: `
      <p>Hello!</p>
      <p>We received a request to reset your email. Click the button below to reset your email:</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>If you have not done so, or have changed your mind about changing your email address, please use the functionality to cancel this action in the application.</p>
    `,
    BUTTON_TEXT: 'Reset Your Email and Activate Your Account',
    BUTTON_TYPE: 'danger' as const,
  },
  PASSWORD_RESET: {
    TITLE: 'Password Reset',
    CONTENT: `
      <p>Hello!</p>
      <p>We received a request to reset your password. Click the button below to reset your password:</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
    BUTTON_TEXT: 'Reset Your Password',
    BUTTON_TYPE: 'danger' as const,
  },
  BOARD_INVITATION: {
    BUTTON_TEXT: 'Прийняти запрошення',
    BUTTON_TYPE: 'info' as const,
  },
} as const;

export const EMAIL_SUBJECTS = {
  VERIFICATION: 'Activate Your Account - Taskcraft',
  PASSWORD_RESET: 'Reset Your Password - Taskcraft',
  BOARD_INVITATION: (boardTitle: string) =>
    `You have been invited to join the board: ${boardTitle}`,
} as const;
