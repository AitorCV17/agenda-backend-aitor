import { IsNotEmpty, IsOptional } from 'class-validator';

export class NoteDto {
  @IsNotEmpty()
  title!: string;
  @IsOptional()
  content?: string;
  @IsOptional()
  color?: string;
  @IsOptional()
  pinned?: boolean;
}
