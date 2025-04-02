export interface User {
  id: string;
  email: string;
  sub?: string;  // добавляем поле sub, которое может быть как обязательным, так и необязательным
}