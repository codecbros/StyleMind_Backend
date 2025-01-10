import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    required: false,
  })
  @IsNumberString()
  @IsOptional()
  page: number;

  @ApiProperty({
    required: false,
  })
  @IsNumberString()
  @IsOptional()
  limit: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  search: string;
}
