import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class OptionalBooleanPipe implements PipeTransform {
  transform(value: any) {
    if (value === null || value === undefined) {
      return undefined;
    } else if (value === true || value === 'true') {
      return true;
    } else if (value === false || value === 'false') {
      return false;
    } else {
      throw new BadRequestException('Dato booleano inválido');
    }
  }
}
