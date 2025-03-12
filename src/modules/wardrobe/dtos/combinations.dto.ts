import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

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
  })
  @IsOptional()
  @IsNumber()
  take: number;

  @ApiProperty({ type: Number, description: 'Paginación de la búsqueda' })
  @IsOptional()
  @IsNumber()
  page: number;
}
