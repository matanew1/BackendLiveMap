import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/api-response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If already an ApiResponse, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data as ApiResponse<T>;
        }

        // If it's a standard response with statusCode, wrap it
        if (data && typeof data === 'object' && 'statusCode' in data) {
          const response = data as any;
          return ApiResponse.success(
            response.message || 'Success',
            response.data,
          );
        }

        // Otherwise, assume it's data and wrap in success
        return ApiResponse.success('Success', data);
      }),
    );
  }
}
