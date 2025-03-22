export class UserDto {
  // @ts-ignore
  id: string;
  username?: string;
  // @ts-ignore
  email: string;
  // @ts-ignore
  theme: string;
  // @ts-ignore
  notifications: boolean;
  // @ts-ignore
  createdAt: Date;
  // @ts-ignore
  updatedAt: Date;
  lastLogin?: Date;
}