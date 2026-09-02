import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from "@nestjs/common";
import { GrowthService } from "./growth.service";
import { CreateProspectDto, UpdateProspectDto, ProspectQueryDto } from "./growth.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Role } from "@repo/database";

@Controller("admin/growth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MODERATOR)
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  @Get("stats")
  getStats() {
    return this.growthService.getStats();
  }

  @Get("prospects")
  listProspects(@Query() query: ProspectQueryDto) {
    return this.growthService.listProspects(query);
  }

  @Get("prospects/:id")
  getProspect(@Param("id") id: string) {
    return this.growthService.getProspect(id);
  }

  @Post("prospects")
  createProspect(@Body() dto: CreateProspectDto, @Req() req: any) {
    return this.growthService.createProspect(dto, req.user?.id);
  }

  @Put("prospects/:id")
  updateProspect(@Param("id") id: string, @Body() dto: UpdateProspectDto) {
    return this.growthService.updateProspect(id, dto);
  }

  @Delete("prospects/:id")
  @Roles(Role.ADMIN)
  deleteProspect(@Param("id") id: string) {
    return this.growthService.deleteProspect(id);
  }

  @Post("prospects/:id/generate-outreach")
  generateOutreach(@Param("id") id: string) {
    return this.growthService.generateOutreachDraft(id);
  }

  @Post("prospects/:id/verify")
  verifyLink(@Param("id") id: string) {
    return this.growthService.verifyPlacedLink(id);
  }
}
