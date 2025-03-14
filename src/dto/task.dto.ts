import { IsNotEmpty, IsOptional } from 'class-validator';

export class TaskListDto {
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  pinned?: boolean;
}

export class TaskDto {
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  completed?: boolean;

  @IsOptional()
  starred?: boolean;
}
