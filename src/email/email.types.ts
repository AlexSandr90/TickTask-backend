export interface BoardInvitationEmailData {
  to: string;
  receiverName: string;
  senderName: string;
  boardTitle: string;
  invitationToken: string;
  expiresAt: Date;
}

export interface CustomEmtailOptions {
  to: string;
  subject: string;
  title: string;
  content: string;
  buttonText?: string;
  buttonLink?: string;
  buttonType?: 'success' | 'danger' | 'info';
  customText?: string;
}

export interface BasicEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}
