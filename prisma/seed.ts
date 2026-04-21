// ============================================================
// 開発用シードデータ（冪等）
// 実行: npm run db:seed
//
// 全エンティティを安定UUIDで upsert しているので、
// 何度流しても重複が発生せず、値の修正も反映される。
// ============================================================

import { PrismaClient, UserRole, PayType, Gender, GuardType, Availability, ProjectStatus } from "@prisma/client";

const prisma = new PrismaClient();

// ------------------------------------------------------------
// 安定UUID（seed で固定使用。デモセッションと同期）
// ------------------------------------------------------------
const ID = {
  org:        "00000000-0000-0000-0000-000000000001",
  manager:    "00000000-0000-0000-0000-000000000002", // デモセッションと同期
  admin:      "00000000-0000-0000-0000-000000000003",
  accountant: "00000000-0000-0000-0000-000000000004",
  guard:    (i: number) => `00000000-0000-0000-0000-0000000001${String(i).padStart(2, "0")}`,
  client:   (i: number) => `00000000-0000-0000-0000-0000000002${String(i).padStart(2, "0")}`,
  site:     (i: number) => `00000000-0000-0000-0000-0000000003${String(i).padStart(2, "0")}`,
  project:  (i: number) => `00000000-0000-0000-0000-0000000004${String(i).padStart(2, "0")}`,
} as const;

async function main() {
  console.log("🌱 Seeding database (idempotent)...");

  // --- 警備会社 ---
  const orgData = {
    name:          "サンプル警備株式会社",
    address:       "東京都新宿区西新宿1-1-1",
    tel:           "03-1234-5678",
    licenseNumber: "東京都公安委員会 第30012345号",
  };
  const org = await prisma.organization.upsert({
    where:  { id: ID.org },
    update: orgData,
    create: { id: ID.org, ...orgData },
  });
  console.log("✅ Organization:", org.name);

  // --- 管理者ユーザー ---
  const adminData = {
    orgId:    org.id,
    email:    "admin@sample-keibi.co.jp",
    name:     "山田 太郎",
    nameKana: "ヤマダ タロウ",
    phone:    "090-1111-2222",
    role:     UserRole.ADMIN,
  };
  const admin = await prisma.user.upsert({
    where:  { id: ID.admin },
    update: adminData,
    create: { id: ID.admin, ...adminData },
  });

  // --- 管制担当（デモセッションと同期） ---
  const managerData = {
    orgId:    org.id,
    email:    "kansei@sample-keibi.co.jp",
    name:     "鈴木 花子",
    nameKana: "スズキ ハナコ",
    phone:    "090-3333-4444",
    role:     UserRole.MANAGER,
  };
  const manager = await prisma.user.upsert({
    where:  { id: ID.manager },
    update: managerData,
    create: { id: ID.manager, ...managerData },
  });

  // --- 経理担当 ---
  const accountantData = {
    orgId:    org.id,
    email:    "keiri@sample-keibi.co.jp",
    name:     "佐藤 次郎",
    nameKana: "サトウ ジロウ",
    phone:    "090-5555-6666",
    role:     UserRole.ACCOUNTANT,
  };
  const accountant = await prisma.user.upsert({
    where:  { id: ID.accountant },
    update: accountantData,
    create: { id: ID.accountant, ...accountantData },
  });

  // --- 隊員10名（User + GuardProfile を個別 upsert） ---
  const guardDefs = [
    { name: "田中 一郎", kana: "タナカ イチロウ",   gender: Gender.MALE,   age: 45 },
    { name: "高橋 二郎", kana: "タカハシ ジロウ",   gender: Gender.MALE,   age: 55 },
    { name: "渡辺 三郎", kana: "ワタナベ サブロウ", gender: Gender.MALE,   age: 62 },
    { name: "伊藤 四郎", kana: "イトウ シロウ",     gender: Gender.MALE,   age: 38 },
    { name: "小林 五郎", kana: "コバヤシ ゴロウ",   gender: Gender.MALE,   age: 50 },
    { name: "加藤 六郎", kana: "カトウ ロクロウ",   gender: Gender.MALE,   age: 28 },
    { name: "吉田 七子", kana: "ヨシダ ナナコ",     gender: Gender.FEMALE, age: 35 },
    { name: "山口 八郎", kana: "ヤマグチ ハチロウ", gender: Gender.MALE,   age: 70 },
    { name: "松本 九郎", kana: "マツモト クロウ",   gender: Gender.MALE,   age: 42 },
    { name: "井上 十子", kana: "イノウエ トオコ",   gender: Gender.FEMALE, age: 30 },
  ];

  const guards = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < guardDefs.length; i++) {
    const g = guardDefs[i];
    const guardId = ID.guard(i + 1);

    const userData = {
      orgId:    org.id,
      email:    `guard${i + 1}@sample-keibi.co.jp`,
      name:     g.name,
      nameKana: g.kana,
      phone:    `080-${String(1000 + i).padStart(4, "0")}-${String(2000 + i).padStart(4, "0")}`,
      role:     UserRole.GUARD,
    };

    const user = await prisma.user.upsert({
      where:  { id: guardId },
      update: userData,
      create: { id: guardId, ...userData },
    });

    const profileData = {
      birthDate:       new Date(`${currentYear - g.age}-${String((i % 12) + 1).padStart(2, "0")}-15`),
      gender:          g.gender,
      hireDate:        new Date(`${2024 - (i % 5)}-04-01`),
      experienceYears: (i % 5) + 1,
      qualifications:  i < 5 ? ["交通誘導警備業務2級"] : ["施設警備業務2級"],
      skills:          i % 3 === 0 ? ["リーダー経験あり", "夜勤対応可"] : ["日勤希望"],
      payType:         i < 7 ? PayType.DAILY : PayType.MONTHLY,
      basePay:         i < 7 ? 10000 + (i * 500) : 250000,
      bankName:        "みずほ銀行",
      bankBranch:      "新宿支店",
      bankAccountType: "普通",
      bankAccountNum:  `123456${i}`,
      bankAccountName: g.kana.replace(" ", ""),
      hasSmartphone:   i < 8,
      address:         `東京都${["新宿区", "渋谷区", "豊島区", "中野区", "杉並区"][i % 5]}`,
    };

    await prisma.guardProfile.upsert({
      where:  { userId: user.id },
      update: profileData,
      create: { userId: user.id, ...profileData },
    });

    guards.push(user);
  }
  console.log(`✅ Guards: ${guards.length} members`);

  // --- 得意先 ---
  const clientDefs = [
    {
      id:            ID.client(1),
      name:          "SBビルマネジメント株式会社",
      contactPerson: "木村 部長",
      tel:           "03-9999-8888",
      email:         "kimura@sb-bm.example.com",
      address:       "東京都港区六本木1-1-1",
      billingCycleDay: 31,
      paymentTermDays: 30,
    },
    {
      id:            ID.client(2),
      name:          "東京建設株式会社",
      contactPerson: "中村 課長",
      tel:           "03-7777-6666",
      email:         "nakamura@tokyo-kensetsu.example.com",
      address:       "東京都千代田区丸の内2-2-2",
      billingCycleDay: 20,
      paymentTermDays: 45,
    },
  ];

  const clients = [];
  for (const c of clientDefs) {
    const { id, ...rest } = c;
    const client = await prisma.client.upsert({
      where:  { id },
      update: { orgId: org.id, ...rest },
      create: { id, orgId: org.id, ...rest },
    });
    clients.push(client);
  }
  console.log(`✅ Clients: ${clients.length}`);

  // --- 現場 ---
  const siteDefs = [
    {
      id:        ID.site(1),
      clientId:  clients[0].id,
      name:      "六本木ヒルズ 施設警備",
      address:   "東京都港区六本木6-10-1",
      latitude:  35.6605,
      longitude: 139.7292,
      guardType: GuardType.TYPE_1,
    },
    {
      id:        ID.site(2),
      clientId:  clients[1].id,
      name:      "丸の内再開発工事 交通誘導",
      address:   "東京都千代田区丸の内3-3-3",
      latitude:  35.6812,
      longitude: 139.7671,
      guardType: GuardType.TYPE_2,
    },
    {
      id:        ID.site(3),
      clientId:  clients[0].id,
      name:      "新宿駅南口 イベント警備",
      address:   "東京都新宿区新宿3-38-1",
      latitude:  35.6896,
      longitude: 139.7006,
      guardType: GuardType.TYPE_2,
    },
  ];

  const sites = [];
  for (const s of siteDefs) {
    const { id, ...rest } = s;
    const site = await prisma.site.upsert({
      where:  { id },
      update: { orgId: org.id, ...rest },
      create: { id, orgId: org.id, ...rest },
    });
    sites.push(site);
  }
  console.log(`✅ Sites: ${sites.length}`);

  // --- 案件 ---
  const projectDefs = [
    {
      id:             ID.project(1),
      siteId:         sites[0].id,
      name:           "[A現場] 施設警備 常駐",
      startDate:      new Date("2025-04-01"),
      endDate:        new Date("2025-09-30"),
      requiredGuards: 3,
      startTime:      "08:00",
      endTime:        "17:00",
      unitPrice:      18000,
      guardPay:       11000,
      status:         ProjectStatus.ACTIVE,
    },
    {
      id:             ID.project(2),
      siteId:         sites[1].id,
      name:           "[B現場] 交通誘導 日勤",
      startDate:      new Date("2025-04-15"),
      endDate:        new Date("2025-12-31"),
      requiredGuards: 5,
      startTime:      "08:00",
      endTime:        "17:00",
      unitPrice:      16000,
      guardPay:       10000,
      status:         ProjectStatus.ACTIVE,
    },
    {
      id:             ID.project(3),
      siteId:         sites[2].id,
      name:           "[C現場] イベント警備 夜勤",
      startDate:      new Date("2025-05-01"),
      endDate:        new Date("2025-05-03"),
      requiredGuards: 4,
      startTime:      "18:00",
      endTime:        "06:00",
      unitPrice:      22000,
      guardPay:       14000,
      nightRate:      1.25,
      status:         ProjectStatus.DRAFT,
    },
  ];

  const projects = [];
  for (const p of projectDefs) {
    const { id, ...rest } = p;
    const project = await prisma.project.upsert({
      where:  { id },
      update: { orgId: org.id, ...rest },
      create: { id, orgId: org.id, ...rest },
    });
    projects.push(project);
  }
  console.log(`✅ Projects: ${projects.length}`);

  // --- シフト提出（サンプル） ---
  // @@unique([userId, targetDate]) を使って upsert
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let shiftCount = 0;
  for (const guard of guards.slice(0, 5)) {
    for (let d = 0; d < 7; d++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + d);

      const availability =
        d % 7 === 0 ? Availability.NG :
        d % 3 === 0 ? Availability.NIGHT_OK :
        Availability.DAY_OK;

      await prisma.shiftSubmission.upsert({
        where:  { userId_targetDate: { userId: guard.id, targetDate } },
        update: { availability },
        create: { userId: guard.id, targetDate, availability },
      });
      shiftCount++;
    }
  }
  console.log(`✅ Shift submissions: ${shiftCount}`);

  console.log("\n🎉 Seed completed successfully!");
  console.log("---");
  console.log(`  Organization: ${org.name}`);
  console.log(`  Admin:        ${admin.email}`);
  console.log(`  Manager:      ${manager.email}`);
  console.log(`  Accountant:   ${accountant.email}`);
  console.log(`  Guards:       ${guards.length} members`);
  console.log(`  Clients:      ${clients.length}`);
  console.log(`  Sites:        ${sites.length}`);
  console.log(`  Projects:     ${projects.length}`);
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
