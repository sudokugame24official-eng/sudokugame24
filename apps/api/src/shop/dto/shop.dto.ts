import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';

export class BuyProductDto {
  @IsString()
  productId!: string;
}

export class BuyCoinsDto {
  @IsString()
  packId!: string;
}

export enum ShopProductTypeEnum {
  PERK = 'perk',
  CONSUMABLE = 'consumable',
}

export enum ShopProductCategoryEnum {
  COSMETIC = 'cosmetic',
  UTILITY = 'utility',
  PRIVILEGE = 'privilege',
  PACK = 'pack',
}

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsInt()
  @Min(0)
  @Max(1000000)
  priceCoins!: number;

  @IsEnum(ShopProductTypeEnum)
  type!: ShopProductTypeEnum;

  @IsOptional()
  @IsString()
  @IsIn(['NO_ADS', 'CHAT_VIP', 'CUSTOM_BADGE', 'EXTRA_HINTS'])
  entitlement?: string;

  @IsOptional()
  @IsEnum(ShopProductCategoryEnum)
  category?: ShopProductCategoryEnum;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxPerUser?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000)
  priceCoins?: number;

  @IsOptional()
  @IsEnum(ShopProductTypeEnum)
  type?: ShopProductTypeEnum;

  @IsOptional()
  @IsString()
  @IsIn(['NO_ADS', 'CHAT_VIP', 'CUSTOM_BADGE', 'EXTRA_HINTS'])
  entitlement?: string;

  @IsOptional()
  @IsEnum(ShopProductCategoryEnum)
  category?: ShopProductCategoryEnum;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxPerUser?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
