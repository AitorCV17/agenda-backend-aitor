import {
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  IsIn,
  Min
} from 'class-validator'

export class EventDto {
  @IsNotEmpty()
  title!: string

  @IsOptional()
  description?: string

  @IsDateString()
  startTime!: string

  @IsDateString()
  endTime!: string

  @IsOptional()
  color?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  reminderOffset?: number

  @IsOptional()
  @IsIn(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
  recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  
  @IsOptional()
  location?: string
}
