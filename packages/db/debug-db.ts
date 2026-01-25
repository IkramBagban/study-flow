
import { prisma } from "./index";

async function main() {
    const users = await prisma.user.findMany();
    console.log("Users:", users.length);
    users.forEach(u => console.log(`User: ${u.id} - ${u.email}`));

    const courses = await prisma.course.findMany();
    console.log("Total Courses:", courses.length);
    courses.forEach(c => console.log(`Course: ${c.id} - Title: ${c.title} - Owner: ${c.userId}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
