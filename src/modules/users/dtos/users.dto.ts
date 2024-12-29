import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
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
  body_description: string;

  @ApiProperty({ title: 'Descripción del perfil', required: false })
  @IsString()
  @IsOptional()
  profile_description: string;

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
}

export class UpdateUserDto extends OmitType(CreateUserDto, [
  'email',
  'password',
]) {}
