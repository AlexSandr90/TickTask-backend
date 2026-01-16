export interface UserWithoutPassword {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  theme: string;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  sub?: string; // добавляем поле sub, которое может быть как обязательным, так и необязательным
}
