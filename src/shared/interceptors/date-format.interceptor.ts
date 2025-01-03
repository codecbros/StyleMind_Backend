import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import moment from 'moment-timezone';

@Injectable()
export class DateFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return this.formatDates(data);
      }),
    );
  }

  private formatDates(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.formatDates(item));
    } else if (typeof data === 'object' && data !== null) {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          // eslint-disable-next-line security/detect-object-injection
          data[key] = this.formatDateField(key, data[key]);
        }
      }
    }
    return data;
  }

  private formatDateField(key: string, value: any): any {
    const dateFields = [
      'createdAt',
      'updatedAt',
      'date',
      'startDate',
      'endDate',
    ];
    if (dateFields.includes(key)) {
      return moment(value)
        .locale('es')
        .tz('America/Guayaquil')
        .format('dddd, D [de] MMMM [del] YYYY, H:mm');
    } else {
      return this.formatDates(value);
    }
  }
}
