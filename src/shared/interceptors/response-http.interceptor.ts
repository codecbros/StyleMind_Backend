import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ResponseDataInterface } from '@shared/interfaces/response-data.interface';

@Injectable()
export class ResponseHttpInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response: ResponseDataInterface<any> | any) => {
        const statusCode = context.switchToHttp().getResponse().statusCode;
        const method = context.switchToHttp().getRequest().method;

        if (method === 'DELETE' && statusCode === 200) {
          return {
            statusCode,
            message: response?.message || 'Registro eliminado correctamente',
          };
        }

        // Check if response is a paginated response (has pagination metadata and data)
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          'page' in response &&
          'limit' in response &&
          'total' in response &&
          'totalPages' in response
        ) {
          return {
            statusCode,
            ...response,
          };
        }

        return {
          statusCode,
          message: response?.message || 'Operación realizada correctamente',
          data: response?.data,
        };
      }),
    );
  }
}
