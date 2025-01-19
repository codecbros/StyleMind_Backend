import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsHexColor,
  IsNumber,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ title: 'Correo electrónico' })
  @IsEmail()
  email: string;

  @ApiProperty({ title: 'Nombre de usuario' })
  @IsString()
  firstName: string;

  @ApiProperty({ title: 'Apellido de usuario' })
  @IsString()
  lastName: string;

  @ApiProperty({ title: 'Contraseña' })
  @IsStrongPassword(
    {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'La contraseña debe tener al menos 6 caracteres, 1 minúscula, 1 mayúscula, 1 número y 1 símbolo',
    },
  )
  password: string;

  @ApiProperty({ title: 'Descripción del cuerpo', required: false })
  @IsString()
  @IsOptional()
  bodyDescription: string;

  @ApiProperty({ title: 'Descripción del perfil', required: false })
  @IsString()
  @IsOptional()
  profileDescription: string;

  @ApiProperty({ title: 'Peso', required: false, type: 'number' })
  @IsNumber()
  @IsOptional()
  weight: number;

  @ApiProperty({ title: 'Altura', required: false, type: 'number' })
  @IsNumber()
  @IsOptional()
  height: number;

  @ApiProperty({ title: 'Fecha de nacimiento', required: false })
  @IsDateString(
    { strict: true, strictSeparator: true },
    { message: 'La fecha de nacimiento debe ser una fecha válida' },
  )
  @IsOptional()
  birthDate: Date;

  @ApiProperty({ required: false, title: 'URL de la imagen de perfil' })
  @IsString()
  @IsOptional()
  profileImageUrl: string;

  @ApiProperty({ required: true, title: 'Id del Género' })
  @IsString()
  genderId: string;

  @ApiProperty({ required: false })
  @IsHexColor()
  @IsOptional()
  skinColor: string;
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password']),
) {}

export class UpdateUserPasswordDto extends PickType(CreateUserDto, [
  'password',
]) {}
