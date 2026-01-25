
import { prisma } from "./index";

async function main() {
    const users = await prisma.user.findMany();
    console.log("--- USERS ---");
    users.forEach(u => console.log(`ID: ${u.id} | Email: ${u.email}`));

    const courses = await prisma.course.findMany({
        include: { user: true }
    });
    console.log("\n--- COURSES ---");
    courses.forEach(c => console.log(`ID: ${c.id} | Title: "${c.title}" | OwnerID: ${c.userId} | OwnerEmail: ${c.user.email}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
