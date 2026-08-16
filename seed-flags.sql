-- Modern keys (used by FeatureFlagsService)
INSERT INTO "FeatureFlag" (key, enabled, description, "updatedAt")
VALUES 
  ('SHOP_ENABLED', true, 'Enable shop (modern key)', NOW()),
  ('PAYMENTS_ENABLED', true, 'Enable payments (modern key)', NOW()),
  ('ADS_ENABLED', true, 'Enable ads (modern key)', NOW()),
  ('TOURNAMENTS_ENABLED', false, 'Enable tournaments', NOW()),
  ('SPECTATOR_MODE_ENABLED', true, 'Enable spectator mode', NOW()),
  ('PROGRAMMATIC_SEO_ENABLED', false, 'Enable programmatic SEO', NOW()),
  ('PRIVATE_MESSAGES_ENABLED', true, 'Enable private messages', NOW()),
  ('FRIENDS_ENABLED', true, 'Enable friends system', NOW()),
  -- Legacy keys (used by ShopService.checkFeatureFlag)
  ('ENABLE_SHOP', true, 'Enable shop (legacy key for ShopService)', NOW()),
  ('ENABLE_STRIPE', true, 'Enable Stripe payments (legacy key)', NOW()),
  ('ENABLE_REWARDED_ADS', true, 'Enable rewarded ads (legacy key)', NOW())
ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled, "updatedAt" = NOW();
