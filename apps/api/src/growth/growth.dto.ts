import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export enum BacklinkStatus {
  PROSPECT = "PROSPECT",
  QUALIFIED = "QUALIFIED",
  CONTACTED = "CONTACTED",
  FOLLOW_UP = "FOLLOW_UP",
  NEGOTIATING = "NEGOTIATING",
  PLACED = "PLACED",
  VERIFIED = "VERIFIED",
  LOST = "LOST",
  REJECTED = "REJECTED",
}

export class CreateProspectDto {
  @IsString() domain: string;
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsString() niche?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100) relevanceScore?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) authorityScore?: number;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() targetPage?: string;
  @IsOptional() @IsString() proposedAnchor?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateProspectDto {
  @IsOptional() @IsEnum(BacklinkStatus) status?: BacklinkStatus;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() targetPage?: string;
  @IsOptional() @IsString() proposedAnchor?: string;
  @IsOptional() @IsString() placedUrl?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() outreachDraft?: string;
  @IsOptional() @IsString() niche?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100) relevanceScore?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) authorityScore?: number;
  @IsOptional() followUpAt?: Date;
}

export class ProspectQueryDto {
  @IsOptional() @IsEnum(BacklinkStatus) status?: BacklinkStatus;
  @IsOptional() @IsString() niche?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
}
