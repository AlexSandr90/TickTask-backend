import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.convertBigIntToNumber(data)));
  }

  private convertBigIntToNumber(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'bigint') {
      // Проверяем, не превышает ли BigInt безопасный диапазон для Number
      if (obj > Number.MAX_SAFE_INTEGER) {
        console.warn(
          `BigInt value ${obj} exceeds MAX_SAFE_INTEGER, converting to string`,
        );
        return obj.toString();
      }
      return Number(obj);
    }

    if (obj instanceof Date) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.convertBigIntToNumber(item));
    }

    if (typeof obj === 'object') {
      const converted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = this.convertBigIntToNumber(value);
      }
      return converted;
    }

    return obj;
  }
}
