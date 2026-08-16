import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Req,
  Headers,
  Query,
  BadRequestException,
  ForbiddenException,
  UseInterceptors,
  Put,
  Delete,
  Param,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { FeatureFlagService } from '../config/feature-flag.service';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { AuditAction } from '../auth/decorators/audit-action.decorator';
import { AuditLogInterceptor } from '../auth/interceptors/audit-log.interceptor';
import {
  BuyCoinsDto,
  BuyProductDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto/shop.dto';

@Controller('shop')
export class ShopController {
  constructor(
    private readonly shopService: ShopService,
    private featureFlags: FeatureFlagService,
  ) {}

  // --- PUBLIC ENDPOINTS ---

  @Get('coin-packs')
  async getCoinPacks() {
    if (!(await this.featureFlags.isFeatureEnabled('SHOP_ENABLED')))
      throw new ForbiddenException('Shop is disabled');
    return this.shopService.getCoinPacks();
  }

  @Get('products')
  async getProducts() {
    if (!(await this.featureFlags.isFeatureEnabled('SHOP_ENABLED')))
      throw new ForbiddenException('Shop is disabled');
    return this.shopService.getProducts();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-perks')
  async getMyPerks(@Request() req) {
    return this.shopService.getUserPerks(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('buy-coins')
  async buyCoins(@Request() req, @Body() body: BuyCoinsDto) {
    if (!(await this.featureFlags.isFeatureEnabled('PAYMENTS_ENABLED')))
      throw new ForbiddenException('Payments are disabled');
    return this.shopService.createCheckoutSession(req.user.id, body.packId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('buy-product')
  async buyProduct(@Request() req, @Body() body: BuyProductDto) {
    if (!(await this.featureFlags.isFeatureEnabled('SHOP_ENABLED')))
      throw new ForbiddenException('Shop is disabled');
    return this.shopService.buyProduct(req.user.id, body.productId);
  }

  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('watch-ad')
  async watchAd(@Request() req) {
    if (!(await this.featureFlags.isFeatureEnabled('ADS_ENABLED')))
      throw new ForbiddenException('Ads are disabled');
    return this.shopService.rewardAdWatch(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('purchase/status')
  async getPurchaseStatus(
    @Request() req,
    @Query('sessionId') sessionId: string,
  ) {
    if (!sessionId) throw new BadRequestException('sessionId requis');
    return this.shopService.verifyAndCompleteSession(req.user.id, sessionId);
  }

  @Post('webhook')
  async stripeWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // P1-H: signature verification is ALWAYS enforced (no test bypass).
    const event = await this.shopService.verifyStripeWebhook(signature, req.rawBody);

    if (event.type === 'checkout.session.completed') {
      await this.shopService.handleSuccessfulPayment(
        event.data.object.id,
        event.id,
      );
    }
    return { received: true };
  }

  // --- ADMIN ENDPOINTS ---

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @UseInterceptors(AuditLogInterceptor)
  @Get('admin/products')
  @RequirePermission('shop.view')
  async getAllProductsAdmin() {
    return this.shopService.getAllProductsAdmin();
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @UseInterceptors(AuditLogInterceptor)
  @Post('admin/products')
  @RequirePermission('shop.manage')
  @AuditAction('shop.create_product')
  async createProductAdmin(@Body() data: CreateProductDto) {
    return this.shopService.createProductAdmin(data as any);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @UseInterceptors(AuditLogInterceptor)
  @Put('admin/products/:id')
  @RequirePermission('shop.manage')
  @AuditAction('shop.update_product')
  async updateProductAdmin(@Param('id') id: string, @Body() data: UpdateProductDto) {
    return this.shopService.updateProductAdmin(id, data as any);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @UseInterceptors(AuditLogInterceptor)
  @Delete('admin/products/:id')
  @RequirePermission('shop.manage')
  @AuditAction('shop.delete_product')
  async deleteProductAdmin(@Param('id') id: string) {
    return this.shopService.deleteProductAdmin(id);
  }
}
