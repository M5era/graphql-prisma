import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    await prisma.category.create({
        data: {
            id:'1235',
            color:'green',
            name:'Category 2'
        },
    })

    const allUsers = await prisma.category.findMany()
    console.dir(allUsers, { depth: null })
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
