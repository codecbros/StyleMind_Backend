import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateClothesDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  season: string;

  @ApiProperty()
  @IsString()
  primaryColor: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @ApiProperty()
  @IsString()
  style: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  material?: string;

  @ApiProperty()
  @IsString()
  size: string;

  @ApiProperty({ description: 'Ids de las categorías relacionadas' })
  @IsArray()
  categoriesId: string[];
}

export class UpdateClothesDto extends PartialType(
  OmitType(CreateClothesDto, ['categoriesId']),
) {}

export class WardrobeCategoryDto {
  @ApiProperty()
  @IsString()
  itemId: string;

  @ApiProperty()
  @IsString()
  categoryId: string;
}
