import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsBoolean()
  isPublic: boolean;
}

export class UpdateCategoryDto extends PickType(CreateCategoryDto, [
  'description',
]) {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPublic: boolean;
}
