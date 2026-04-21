// ============================================================
// 開発用シードデータ
// 実行: npm run db:seed
// ============================================================

import { PrismaClient, UserRole, PayType, Gender, GuardType, Availability } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // --- 警備会社（固定ID: デモセッションと同期）---
  const DEMO_ORG_ID  = "00000000-0000-0000-0000-000000000001";
  const DEMO_USER_ID = "00000000-0000-0000-0000-000000000002";

  const org = await prisma.organization.upsert({
    where:  { id: DEMO_ORG_ID },
    update: {},
    create: {
      id:            DEMO_ORG_ID,
      name:          "サンプル警備株式会社",
      address:       "東京都新宿区西新宿1-1-1",
      tel:           "03-1234-5678",
      licenseNumber: "東京都公安委員会 第30012345号",
    },
  });
  console.log("✅ Organization created:", org.name);

  // --- 管理者ユーザー ---
  const admin = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "admin@sample-keibi.co.jp",
      name: "山田 太郎",
      nameKana: "ヤマダ タロウ",
      phone: "090-1111-2222",
      role: UserRole.ADMIN,
    },
  });

  // --- 管制担当（固定ID: デモセッションと同期）---
  const manager = await prisma.user.upsert({
    where:  { id: DEMO_USER_ID },
    update: {},
    create: {
      id:       DEMO_USER_ID,
      orgId:    org.id,
      email:    "kansei@sample-keibi.co.jp",
      name:     "鈴木 花子",
      nameKana: "スズキ ハナコ",
      phone:    "090-3333-4444",
      role:     UserRole.MANAGER,
    },
  });

  // --- 経理担当 ---
  const accountant = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "keiri@sample-keibi.co.jp",
      name: "佐藤 次郎",
      nameKana: "サトウ ジロウ",
      phone: "090-5555-6666",
      role: UserRole.ACCOUNTANT,
    },
  });

  // --- 隊員10名 ---
  const guardNames = [
    { name: "田中 一郎", kana: "タナカ イチロウ", gender: Gender.MALE, age: 45 },
    { name: "高橋 二郎", kana: "タカハシ ジロウ", gender: Gender.MALE, age: 55 },
    { name: "渡辺 三郎", kana: "ワタナベ サブロウ", gender: Gender.MALE, age: 62 },
    { name: "伊藤 四郎", kana: "イトウ シロウ", gender: Gender.MALE, age: 38 },
    { name: "小林 五郎", kana: "コバヤシ ゴロウ", gender: Gender.MALE, age: 50 },
    { name: "加藤 六郎", kana: "カトウ ロクロウ", gender: Gender.MALE, age: 28 },
    { name: "吉田 七子", kana: "ヨシダ ナナコ", gender: Gender.FEMALE, age: 35 },
    { name: "山口 八郎", kana: "ヤマグチ ハチロウ", gender: Gender.MALE, age: 70 },
    { name: "松本 九郎", kana: "マツモト クロウ", gender: Gender.MALE, age: 42 },
    { name: "井上 十子", kana: "イノウエ トオコ", gender: Gender.FEMALE, age: 30 },
  ];

  const guards = [];
  for (let i = 0; i < guardNames.length; i++) {
    const g = guardNames[i];
    const birthYear = new Date().getFullYear() - g.age;

    const user = await prisma.user.create({
      data: {
        orgId: org.id,
        email: `guard${i + 1}@sample-keibi.co.jp`,
        name: g.name,
        nameKana: g.kana,
        phone: `080-${String(1000 + i).padStart(4, "0")}-${String(2000 + i).padStart(4, "0")}`,
        role: UserRole.GUARD,
        guardProfile: {
          create: {
            birthDate: new Date(`${birthYear}-${String((i % 12) + 1).padStart(2, "0")}-15`),
            gender: g.gender,
            hireDate: new Date(`${2024 - (i % 5)}-04-01`),
            experienceYears: i % 5 + 1,
            qualifications: i < 5 ? ["交通誘導警備業務2級"] : ["施設警備業務2級"],
            skills: i % 3 === 0 ? ["リーダー経験あり", "夜勤対応可"] : ["日勤希望"],
            payType: i < 7 ? PayType.DAILY : PayType.MONTHLY,
            basePay: i < 7 ? 10000 + (i * 500) : 250000,
            bankName: "みずほ銀行",
            bankBranch: "新宿支店",
            bankAccountType: "普通",
            bankAccountNum: `123456${i}`,
            bankAccountName: g.kana.replace(" ", ""),
            hasSmartphone: i < 8, // 2名はガラケー
            address: `東京都${["新宿区", "渋谷区", "豊島区", "中野区", "杉並区"][i % 5]}`,
          },
        },
      },
    });
    guards.push(user);
  }
  console.log(`✅ ${guards.length} guards created`);

  // --- 得意先 ---
  const client1 = await prisma.client.create({
    data: {
      orgId: org.id,
      name: "SBビルマネジメント株式会社",
      contactPerson: "木村 部長",
      tel: "03-9999-8888",
      email: "kimura@sb-bm.example.com",
      address: "東京都港区六本木1-1-1",
      billingCycleDay: 31,
      paymentTermDays: 30,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      orgId: org.id,
      name: "東京建設株式会社",
      contactPerson: "中村 課長",
      tel: "03-7777-6666",
      email: "nakamura@tokyo-kensetsu.example.com",
      address: "東京都千代田区丸の内2-2-2",
      billingCycleDay: 20,
      paymentTermDays: 45,
    },
  });
  console.log("✅ 2 clients created");

  // --- 現場 ---
  const site1 = await prisma.site.create({
    data: {
      orgId: org.id,
      clientId: client1.id,
      name: "六本木ヒルズ 施設警備",
      address: "東京都港区六本木6-10-1",
      latitude: 35.6605,
      longitude: 139.7292,
      guardType: GuardType.TYPE_1,
    },
  });

  const site2 = await prisma.site.create({
    data: {
      orgId: org.id,
      clientId: client2.id,
      name: "丸の内再開発工事 交通誘導",
      address: "東京都千代田区丸の内3-3-3",
      latitude: 35.6812,
      longitude: 139.7671,
      guardType: GuardType.TYPE_2,
    },
  });

  const site3 = await prisma.site.create({
    data: {
      orgId: org.id,
      clientId: client1.id,
      name: "新宿駅南口 イベント警備",
      address: "東京都新宿区新宿3-38-1",
      latitude: 35.6896,
      longitude: 139.7006,
      guardType: GuardType.TYPE_2,
    },
  });
  console.log("✅ 3 sites created");

  // --- 案件 ---
  const project1 = await prisma.project.create({
    data: {
      orgId: org.id,
      siteId: site1.id,
      name: "[A現場] 施設警備 常駐",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2025-09-30"),
      requiredGuards: 3,
      startTime: "08:00",
      endTime: "17:00",
      unitPrice: 18000,
      guardPay: 11000,
      status: "ACTIVE",
    },
  });

  const project2 = await prisma.project.create({
    data: {
      orgId: org.id,
      siteId: site2.id,
      name: "[B現場] 交通誘導 日勤",
      startDate: new Date("2025-04-15"),
      endDate: new Date("2025-12-31"),
      requiredGuards: 5,
      startTime: "08:00",
      endTime: "17:00",
      unitPrice: 16000,
      guardPay: 10000,
      status: "ACTIVE",
    },
  });

  const project3 = await prisma.project.create({
    data: {
      orgId: org.id,
      siteId: site3.id,
      name: "[C現場] イベント警備 夜勤",
      startDate: new Date("2025-05-01"),
      endDate: new Date("2025-05-03"),
      requiredGuards: 4,
      startTime: "18:00",
      endTime: "06:00",
      unitPrice: 22000,
      guardPay: 14000,
      nightRate: 1.25,
      status: "DRAFT",
    },
  });
  console.log("✅ 3 projects created");

  // --- シフト提出（サンプル） ---
  const today = new Date();
  for (const guard of guards.slice(0, 5)) {
    for (let d = 0; d < 7; d++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + d);

      await prisma.shiftSubmission.create({
        data: {
          userId: guard.id,
          targetDate,
          availability:
            d % 7 === 0 ? Availability.NG :
            d % 3 === 0 ? Availability.NIGHT_OK :
            Availability.DAY_OK,
        },
      });
    }
  }
  console.log("✅ Shift submissions created");

  console.log("\n🎉 Seed completed successfully!");
  console.log("---");
  console.log(`  Organization: ${org.name}`);
  console.log(`  Admin: ${admin.email}`);
  console.log(`  Manager: ${manager.email}`);
  console.log(`  Accountant: ${accountant.email}`);
  console.log(`  Guards: ${guards.length} members`);
  console.log(`  Clients: 2`);
  console.log(`  Sites: 3`);
  console.log(`  Projects: 3`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
