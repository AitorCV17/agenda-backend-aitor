import { IsEmail, IsNotEmpty, IsIn } from 'class-validator'

export class ShareItemDto {
  @IsEmail()
  email!: string

  @IsNotEmpty()
  @IsIn(['READ', 'EDIT'])
  permission!: 'READ' | 'EDIT'
}
