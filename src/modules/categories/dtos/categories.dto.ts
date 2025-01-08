import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [String], description: 'Array de ids de géneros' })
  @IsArray()
  gendersIds: string[];
}

export class UpdateCategoryDto extends PartialType(
  PickType(CreateCategoryDto, ['name', 'description']),
) {}
