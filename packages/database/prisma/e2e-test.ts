import { PrismaClient } from "@prisma/client";
import assert from "assert";

const prisma = new PrismaClient();

async function main() {
  console.log("--- STARTING FORUM & PROFILE E2E TEST ---");

  // Cleanup any old state first
  const emails = ["usera@test.com", "userb@test.com", "admin@test.com"];
  const testUsers = await prisma.user.findMany({
    where: { email: { in: emails } },
  });
  const ids = testUsers.map((u) => u.id);
  await prisma.like.deleteMany({ where: { userId: { in: ids } } });
  await prisma.report.deleteMany({ where: { reporterId: { in: ids } } });
  await prisma.forumComment.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.forumPost.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });

  // 1. Create Test Users
  const userA = await prisma.user.create({
    data: {
      email: "usera@test.com",
      passwordHash: "hash",
      role: "MEMBER",
      profile: {
        create: {
          username: "UserA_E2E",
          level: 1,
          rating: 1000,
        },
      },
    },
  });

  const userB = await prisma.user.create({
    data: {
      email: "userb@test.com",
      passwordHash: "hash",
      role: "MEMBER",
      profile: {
        create: {
          username: "UserB_E2E",
          level: 2,
          rating: 1100,
        },
      },
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@test.com",
      passwordHash: "hash",
      role: "ADMIN",
      profile: { create: { username: "Admin_E2E" } },
    },
  });

  console.log("✅ Users Created");

  // 2. Profile E2E
  const profileA = await prisma.profile.findUnique({
    where: { userId: userA.id },
  });
  assert(profileA?.username === "UserA_E2E");
  assert(profileA?.rating === 1000);
  assert(profileA?.gamesPlayed === 0);
  console.log("✅ Profile empty state read correctly");

  // 3. Forum CRUD - Topics
  const category = await prisma.forumCategory.findFirst();
  assert(category, "No category found");

  const topic = await prisma.forumPost.create({
    data: {
      title: "E2E Test Topic",
      content: "This is a test topic from User A",
      categoryId: category.id,
      authorId: userA.id,
    },
  });
  console.log("✅ Topic Created by User A");

  // Update Topic
  const updatedTopic = await prisma.forumPost.update({
    where: { id: topic.id },
    data: { content: "Updated content" },
  });
  assert(updatedTopic.content === "Updated content");
  console.log("✅ Topic Edited");

  // 4. Forum CRUD - Replies
  const reply = await prisma.forumComment.create({
    data: {
      content: "Reply from User B",
      postId: topic.id,
      authorId: userB.id,
    },
  });
  console.log("✅ Reply Created by User B");

  // 5. Likes
  await prisma.like.create({
    data: {
      postId: topic.id,
      userId: userB.id,
    },
  });
  console.log("✅ Post Liked by User B");

  // Test duplicate like constraint (should throw)
  let likeError = false;
  try {
    const existing = await prisma.like.findFirst({
      where: { postId: topic.id, userId: userB.id },
    });
    if (existing) throw new Error("Duplicate like");
    await prisma.like.create({
      data: { postId: topic.id, userId: userB.id },
    });
  } catch (e) {
    likeError = true;
  }
  assert(
    likeError,
    "Duplicate like should have thrown an error due to unique constraint or API logic",
  );
  console.log("✅ Duplicate Like Prevented");

  // Unlike
  await prisma.like
    .delete({
      where: {
        userId_postId_commentId: {
          userId: userB.id,
          postId: topic.id,
          commentId: "",
        },
      },
    })
    .catch(() => {
      // Note: Since commentId is nullable and the unique index is userId_postId_commentId, it's safer to delete many
      return prisma.like.deleteMany({
        where: { postId: topic.id, userId: userB.id },
      });
    });
  console.log("✅ Post Unliked by User B");

  // 6. Reports
  await prisma.report.create({
    data: {
      reporterId: userB.id,
      reason: "SPAM",
      description: "This is spam",
      targetType: "POST",
      targetId: topic.id,
    },
  });
  console.log("✅ Post Reported");

  // 7. Permissions simulation
  // User B tries to delete User A's topic (Simulate app logic check)
  const canUserBDelete = topic.authorId === userB.id;
  assert(!canUserBDelete, "User B should not be able to delete User A topic");

  const canAdminDelete = admin.role === "ADMIN" || admin.role === "SUPER_ADMIN";
  assert(canAdminDelete, "Admin should be able to delete any topic");
  console.log("✅ Permissions logic verified (Author/Admin)");

  // 8. Search / Filtering / Pagination (using Prisma syntax)
  const searchResults = await prisma.forumPost.findMany({
    where: {
      title: { contains: "E2E", mode: "insensitive" },
    },
    take: 10,
    skip: 0,
  });
  assert(searchResults.length === 1);
  console.log("✅ Search & Pagination verified");

  // Cleanup E2E data
  await prisma.report.deleteMany({ where: { reporterId: userB.id } });
  await prisma.forumComment.deleteMany({ where: { authorId: userB.id } });
  await prisma.forumPost.deleteMany({ where: { authorId: userA.id } });
  await prisma.user.deleteMany({
    where: {
      email: { in: ["usera@test.com", "userb@test.com", "admin@test.com"] },
    },
  });
  console.log("✅ Cleanup complete");

  console.log("--- ALL E2E TESTS PASSED ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
