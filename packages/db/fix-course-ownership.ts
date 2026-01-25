
import { prisma } from "./index";

async function main() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
    });

    if (users.length === 0) {
        console.log("No users found. Cannot reassign.");
        return;
    }

    const mainUser = users[0];
    console.log(`Reassigning all courses to User: ${mainUser.email} (${mainUser.id})`);

    const update = await prisma.course.updateMany({
        data: {
            userId: mainUser.id
        }
    });

    console.log(`Updated ${update.count} courses.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
