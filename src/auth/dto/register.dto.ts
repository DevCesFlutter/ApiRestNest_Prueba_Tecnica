import { IsEmail, IsString, IsIn, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail(
    { require_tld: true, allow_ip_domain: false },
    {
      message:
        'Email inválido, use un dominio válido (ej: usuario@dominio.com)',
    },
  )
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/(?=.*[a-z])/, {
    message: 'La contraseña debe contener al menos una letra minúscula',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'La contraseña debe contener al menos una letra mayúscula',
  })
  @Matches(/(?=.*\d)/, {
    message: 'La contraseña debe contener al menos un número',
  })
  @Matches(/(?=.*[@$!%*?&])/, {
    message:
      'La contraseña debe contener al menos un carácter especial @$!%*?&',
  })
  password: string;

  @IsString()
  @IsIn(['admin', 'operaciones'])
  role: string;
}
