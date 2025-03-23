export interface UserWithoutPassword {
  id: string;
  username: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  theme: string;
  notifications: boolean;
}
