import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({
    required: false,
  })
  page: number;

  @ApiProperty({
    required: false,
  })
  limit: number;

  @ApiProperty({
    required: false,
  })
  search: string;

  @ApiProperty({
    required: false,
    default: true,
    description: 'Filtrar por estado. Por defecto es true (solo activos)',
  })
  status: boolean;

  /**
   * The calculated offset for database queries (skip).
   * This is derived from (page - 1) * limit.
   */
  offset: number;
}
