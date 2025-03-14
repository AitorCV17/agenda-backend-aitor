import { IsNotEmpty, IsOptional, IsBoolean, IsString } from 'class-validator';

export class NoteDto {
  @IsNotEmpty({ message: 'El título es requerido' })
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}
