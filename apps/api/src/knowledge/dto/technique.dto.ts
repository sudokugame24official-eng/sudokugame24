import { IsString, IsOptional, MinLength, MaxLength, IsEnum, IsInt, Min } from 'class-validator';

export class TechniqueBaseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  slug!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced', 'expert'])
  level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateTechniqueDto extends TechniqueBaseDto {}

export class UpdateTechniqueDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced', 'expert'])
  level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
