import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@repo/database";
import { CreateProspectDto, UpdateProspectDto, ProspectQueryDto } from "./growth.dto";
import { randomUUID } from "crypto";

@Injectable()
export class GrowthService {
  async listProspects(query: ProspectQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.niche) where.niche = { contains: query.niche, mode: "insensitive" };
    if (query.search) {
      where.OR = [
        { domain: { contains: query.search, mode: "insensitive" } },
        { contactEmail: { contains: query.search, mode: "insensitive" } },
        { niche: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      (prisma as any).backlinkProspect.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      (prisma as any).backlinkProspect.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getProspect(id: string) {
    const prospect = await (prisma as any).backlinkProspect.findUnique({ where: { id } });
    if (!prospect) throw new NotFoundException("Prospect not found");
    return prospect;
  }

  async createProspect(dto: CreateProspectDto, adminId?: string) {
    return (prisma as any).backlinkProspect.create({
      data: {
        id: randomUUID(),
        domain: dto.domain,
        url: dto.url,
        niche: dto.niche,
        relevanceScore: dto.relevanceScore ?? 0,
        authorityScore: dto.authorityScore ?? 0,
        contactEmail: dto.contactEmail,
        contactName: dto.contactName,
        targetPage: dto.targetPage,
        proposedAnchor: dto.proposedAnchor,
        notes: dto.notes,
        createdBy: adminId,
        updatedAt: new Date(),
      },
    });
  }

  async updateProspect(id: string, dto: UpdateProspectDto) {
    await this.getProspect(id);
    const updateData: any = { ...dto, updatedAt: new Date() };
    if (dto.status === "PLACED" && !updateData.contactedAt) updateData.contactedAt = new Date();
    if (dto.status === "VERIFIED") updateData.verifiedAt = new Date();
    return (prisma as any).backlinkProspect.update({ where: { id }, data: updateData });
  }

  async deleteProspect(id: string) {
    await this.getProspect(id);
    await (prisma as any).backlinkProspect.delete({ where: { id } });
    return { success: true };
  }

  async generateOutreachDraft(id: string) {
    const prospect = await this.getProspect(id);
    const draft = `Hi ${prospect.contactName || "there"},

I came across ${prospect.domain} and I really enjoy the content you publish${prospect.niche ? ` about ${prospect.niche}` : ""}.

I run SudokuGame24.com, one of the world"s leading Sudoku platforms with thousands of players daily. We offer${prospect.targetPage ? ` resources at ${prospect.targetPage}` : " free online Sudoku puzzles, strategy guides, and competitive duels"}.

I believe a mention or link to our platform would genuinely add value to your audience who enjoy logic puzzles and brain training.

Would you be open to discussing a collaboration?

Best regards,
SudokuGame24 Team`;

    await (prisma as any).backlinkProspect.update({
      where: { id },
      data: { outreachDraft: draft, updatedAt: new Date() },
    });

    return { outreachDraft: draft };
  }

  async verifyPlacedLink(id: string) {
    const prospect = await this.getProspect(id);
    if (!prospect.placedUrl) throw new NotFoundException("No placed URL to verify");

    // In production this would use an HTTP HEAD check via fetch/axios
    // Here we mark as last-checked and return status
    await (prisma as any).backlinkProspect.update({
      where: { id },
      data: { lastCheckedAt: new Date(), updatedAt: new Date() },
    });

    return { id, placedUrl: prospect.placedUrl, lastCheckedAt: new Date() };
  }

  async getStats() {
    const all = await (prisma as any).backlinkProspect.groupBy({
      by: ["status"],
      _count: { id: true },
    });
    const stats: Record<string, number> = {};
    for (const row of all) stats[row.status] = row._count.id;
    return stats;
  }
}
