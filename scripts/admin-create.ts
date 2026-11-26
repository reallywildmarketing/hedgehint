import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"
import fs from "fs"
import path from "path"
import os from "os"

const prisma = new PrismaClient()

async function loadEnvFallback() {
  const configEnvPath = path.join(os.homedir(), ".config", "hedgehint", "admin.env")
  if (fs.existsSync(configEnvPath)) {
    const lines = fs.readFileSync(configEnvPath, "utf-8").split("\n")
    for (const line of lines) {
      const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/)
      if (match) {
        const key = match[1]
        let val = (match[2] || "").trim()
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
        if (!process.env[key]) process.env[key] = val
      }
    }
  }
}

async function main() {
  await loadEnvFallback()

  const email = process.env.ADMIN_EMAIL || "admin@hedgehint.internal"
  const name = process.env.ADMIN_NAME || "System Administrator"
  const password = process.env.ADMIN_PASSWORD || "AdminPass1234!"
  const orgName = process.env.ORG_NAME || "Acme Global Importers"

  console.log(`[admin:create] Provisioning administrator for ${email}...`)

  const passwordHash = await hash(password, 12)

  // 1. Create or update organisation
  let org = await prisma.organisation.findFirst({
    where: { name: orgName },
  })

  if (!org) {
    org = await prisma.organisation.create({
      data: {
        name: orgName,
        baseCurrency: "GBP",
        riskAppetite: "medium",
        status: "active",
      },
    })
    console.log(`[admin:create] Created organisation: "${org.name}" (${org.id})`)
  } else {
    console.log(`[admin:create] Found organisation: "${org.name}" (${org.id})`)
  }

  // 2. Create or reset administrator account
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: "admin",
      mustChangePassword: false,
    },
    create: {
      email,
      name,
      passwordHash,
      role: "admin",
      mustChangePassword: false,
    },
  })

  // 3. Ensure membership in organisation as admin
  await prisma.organisationMember.upsert({
    where: {
      organisationId_userId: {
        organisationId: org.id,
        userId: user.id,
      },
    },
    update: { role: "admin" },
    create: {
      organisationId: org.id,
      userId: user.id,
      role: "admin",
    },
  })

  // Invalidate any stale sessions
  await prisma.session.deleteMany({ where: { userId: user.id } })

  console.log(`[admin:create] Successfully provisioned administrator (User ID: ${user.id}).`)
}

main()
  .catch((e) => {
    console.error("[admin:create] Error:", e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
