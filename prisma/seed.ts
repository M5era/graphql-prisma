import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {

  console.log(`Start seeding Accounts...`)
  const result_account: number =
      await prisma.$executeRaw`COPY "Account" FROM 'data/accounts.csv' DELIMITER ',' CSV HEADER`

  console.log(`Start seeding Categories...`)
  const result_categories: number =
      await prisma.$executeRaw`COPY "Category" FROM 'data/categories.csv' DELIMITER ',' CSV HEADER`

  console.log(`Start seeding Transactions...`)
  const result_transactions: number =
      await prisma.$executeRaw`COPY "Transaction" FROM 'data/transactions_cleaned.csv' DELIMITER ',' CSV HEADER`

  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
