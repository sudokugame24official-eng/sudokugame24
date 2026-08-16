import { PrismaClient } from "@prisma/client";
import assert from "assert";

const prisma = new PrismaClient();

async function main() {
  console.log("--- STARTING PHASE 7 SOCIAL E2E TEST ---");

  // Cleanup
  await prisma.friendship.deleteMany({
    where: { user: { email: { contains: "social" } } },
  });
  await prisma.block.deleteMany({
    where: { blocker: { email: { contains: "social" } } },
  });
  await prisma.user.deleteMany({ where: { email: { contains: "social" } } });

  // Create Users
  const userA = await prisma.user.create({
    data: {
      email: "socialA@test.com",
      passwordHash: "hash",
      role: "MEMBER",
      profile: { create: { username: "SocialA" } },
    },
  });
  const userB = await prisma.user.create({
    data: {
      email: "socialB@test.com",
      passwordHash: "hash",
      role: "MEMBER",
      profile: { create: { username: "SocialB" } },
    },
  });
  const userC = await prisma.user.create({
    data: {
      email: "socialC@test.com",
      passwordHash: "hash",
      role: "MEMBER",
      profile: { create: { username: "SocialC" } },
    },
  });

  // 1. Friend Request Flow
  const request = await prisma.friendship.create({
    data: { userId: userA.id, friendId: userB.id, status: "PENDING" },
  });
  assert(request.status === "PENDING", "Request created");

  const accept = await prisma.friendship.update({
    where: { id: request.id },
    data: { status: "ACCEPTED" },
  });
  assert(accept.status === "ACCEPTED", "Request accepted");

  // Verify friendship is mutual for queries
  const bFriends = await prisma.friendship.findMany({
    where: {
      OR: [{ userId: userB.id }, { friendId: userB.id }],
      status: "ACCEPTED",
    },
  });
  assert(bFriends.length === 1, "Friendship query works bidirectionally");
  console.log("✅ Friendship Flow Verified");

  // 2. Block Flow
  // User C blocks User A
  const block = await prisma.block.create({
    data: { blockerId: userC.id, blockedId: userA.id },
  });
  assert(block.id, "Block created");

  // A tries to add C -> Should be stopped by service logic (simulated here)
  let blockError = false;
  try {
    const existingBlock = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userA.id, blockedId: userC.id },
          { blockerId: userC.id, blockedId: userA.id },
        ],
      },
    });
    if (existingBlock) throw new Error("Blocked");
  } catch (e) {
    blockError = true;
  }
  assert(blockError, "Block prevents friend requests");

  // Verify Block bidirectional check
  let bBlockError = false;
  try {
    const existingBlock = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userA.id, blockedId: userB.id },
          { blockerId: userB.id, blockedId: userA.id },
        ],
      },
    });
    if (existingBlock) throw new Error("Blocked");
  } catch (e) {
    bBlockError = true;
  }
  assert(!bBlockError, "No block between A and B");
  console.log("✅ Block Flow Verified");

  // Cleanup
  await prisma.friendship.deleteMany({
    where: { user: { email: { contains: "social" } } },
  });
  await prisma.block.deleteMany({
    where: { blocker: { email: { contains: "social" } } },
  });
  await prisma.user.deleteMany({ where: { email: { contains: "social" } } });
  console.log("✅ Cleanup complete");

  console.log("--- ALL SOCIAL TESTS PASSED ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
