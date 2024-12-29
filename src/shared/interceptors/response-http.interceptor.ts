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
      map(({ message, data }: ResponseDataInterface) => {
        const statusCode = context.switchToHttp().getResponse().statusCode;
        const method = context.switchToHttp().getRequest().method;

        if (method === 'DELETE' && statusCode === 200) {
          return {
            statusCode,
            message: message || 'Registro eliminado correctamente',
          };
        }

        return {
          statusCode,
          message: message || 'Operación realizada correctamente',
          data,
        };
      }),
    );
  }
}
