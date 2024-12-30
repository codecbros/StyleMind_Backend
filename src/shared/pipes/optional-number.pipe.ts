import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class OptionalNumberPipe implements PipeTransform {
  transform(value: any) {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (isNaN(value)) {
      return undefined;
    }

    if (value < 0) {
      return undefined;
    }

    return value;
  }
}
