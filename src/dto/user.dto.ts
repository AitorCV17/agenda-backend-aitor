import { IsEmail, IsNotEmpty, MinLength, ValidateIf } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name!: string;

  @IsEmail({}, { message: 'El correo debe ser válido' })
  email!: string;

  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'El correo debe ser válido' })
  email!: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password!: string;
}

export class UpdateProfileDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name!: string;

  @IsEmail({}, { message: 'El correo debe ser válido' })
  email!: string;
}

export class UpdatePasswordDto {
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  currentPassword!: string;

  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  newPassword!: string;
}

export class UpdateCompleteProfileDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name!: string;

  @IsEmail({}, { message: 'El correo debe ser válido' })
  email!: string;

  @ValidateIf(o => o.newPassword !== undefined)
  @IsNotEmpty({ message: 'La contraseña actual es requerida para actualizar la contraseña' })
  currentPassword?: string;

  @ValidateIf(o => o.currentPassword !== undefined)
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  newPassword?: string;
}
