import { IsEmail, IsIn } from 'class-validator';

export class ShareItemDto {
  @IsEmail()
  email!: string;
  @IsIn(['READ', 'EDIT'])
  permission!: 'READ' | 'EDIT';
}
