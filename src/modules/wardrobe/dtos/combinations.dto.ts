import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCombinationDto {
  @ApiProperty({
    isArray: true,
    type: String,
    description:
      'IDs de las prendas que se usarán como base para la combinación',
  })
  @IsArray()
  clothingItemsBase: string[];

  @ApiProperty({
    isArray: true,
    type: String,
    description:
      'IDs de las categorías de prendas a considerar en la combinación',
  })
  @IsArray()
  categories: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ isArray: true, type: String })
  @IsArray()
  occasions: string[];

  @ApiProperty({
    type: Number,
    description: 'Número de prendas a buscar por categorías',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  take: number;

  @ApiProperty({
    type: Number,
    description: 'Paginación de la búsqueda',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  page: number;
}

class CombinationItemDto {
  @ApiProperty()
  @IsString()
  wardrobeItemId: string;
}

export class SaveCombinationDto extends PickType(CreateCombinationDto, [
  'description',
  'occasions',
]) {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isAIGenerated: boolean;

  @ApiProperty({ isArray: true, type: CombinationItemDto })
  @IsArray()
  @Type(() => CombinationItemDto)
  combinationItems: CombinationItemDto[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  explanation: string;
}

export class AddItemsToCombinationDto extends PickType(SaveCombinationDto, [
  'combinationItems',
]) {
  @ApiProperty()
  @IsString()
  combinationId: string;
}

export class QuickGenerateCombinationDto {
  @ApiProperty({
    description: 'The occasion or purpose for the outfit',
    example: 'casual Friday at work',
    minLength: 3,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  occasion: string;

  @ApiPropertyOptional({
    description: 'Optional flag to request an alternative outfit for the same occasion',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  requestAlternative?: boolean = false;
}
