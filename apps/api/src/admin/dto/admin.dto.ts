import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsObject,
  IsDateString,
} from 'class-validator';

export class UpdateFeatureFlagDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class GrantCoinsDto {
  @IsString()
  userId!: string;

  // Positive only: removing coins from a user balance requires a dedicated,
  // separately-permissioned withdrawal flow — never a negative grant.
  @IsInt()
  @Min(1)
  @Max(1000000)
  amount!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class ReplyTicketDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;
}

export class UpdateMarketingSettingsDto {
  // Flat map of setting key -> value, matching the GET /admin/marketing-settings shape
  @IsObject()
  settings!: Record<string, string>;
}

export enum ContentArticleTypeEnum {
  PAGE = 'page',
  BLOG = 'blog',
  HELP = 'help',
  FAQ = 'faq',
  ACADEMY = 'academy',
}

export class CreateArticleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  slug!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsEnum(ContentArticleTypeEnum)
  type?: ContentArticleTypeEnum;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  canonicalUrl?: string;

  @IsOptional()
  @IsString()
  openGraphImage?: string;

  @IsOptional()
  @IsBoolean()
  noIndex?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateAdSlotDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provider?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  publisherId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  adSlotId?: string;

  @IsOptional()
  @IsObject()
  deviceTarget?: any;

  @IsOptional()
  @IsObject()
  pageTarget?: any;
}

export class UpdateMonetizationFlagDto {
  @IsString()
  @MaxLength(100)
  key!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateAdConfigDto {
  @IsString()
  @MaxLength(50)
  slotName!: string;

  @IsString()
  @MaxLength(50)
  provider!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  publisherId?: string;
}

export class BanUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class UpdateUserRoleDto {
  @IsString()
  @IsEnum(
    [
      'GUEST',
      'MEMBER',
      'PREMIUM_MEMBER',
      'SUPPORT_AGENT',
      'CONTENT_MANAGER',
      'ANALYST',
      'MODERATOR',
      'ADMIN',
      'SUPER_ADMIN',
    ],
  )
  role!: string;
}

export class ScheduleAtDto {
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
