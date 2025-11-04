import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsHexColor,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUrl,
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
  @IsUrl({}, { message: 'La URL de la imagen de perfil debe ser una URL válida' })
  @IsOptional()
  profilePicture: string;

  @ApiProperty({ required: true, title: 'Id del Género' })
  @IsNotEmpty()
  @IsString()
  genderId: string;

  @ApiProperty({ required: false, title: 'Color de piel' })
  @IsHexColor({ message: 'Debe ser un color en hexadecimal' })
  @IsOptional()
  skinColor: string;

  @ApiProperty({ required: false, title: 'Color de cabello' })
  @IsString()
  @IsOptional()
  hairColor: string;
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password', 'genderId']),
) {
  @ApiProperty({ required: true, title: 'Id del Género' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  genderId: string;
}

export class UpdateUserPasswordDto extends PickType(CreateUserDto, [
  'password',
]) {}
