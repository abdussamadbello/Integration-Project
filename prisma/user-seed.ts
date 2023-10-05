import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedData() {
    try {
        const user1 = await prisma.user.create({
            data: {
                email: `${process.env.CONFLUENCE_USER_EMAIL}`,
                name: 'John Doe',
                createdAt: new Date(),
            },
        });

        const user2 = await prisma.user.create({
            data: {
                email: 'user2@example.com',
                name: 'Jane Doe',
                createdAt: new Date(),
            },
        });
        console.log('Data seeded successfully');
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await prisma.$disconnect();
    }
    
}

seedData();
