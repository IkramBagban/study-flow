import { CourseService } from "./course-service";
import { prisma } from "@study-flow/db";

async function testDBCourseGen() {
    console.log("... Creating Dummy User ...");

    // Ensure we have a user
    let user = await prisma.user.findFirst();
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: "test@study-flow.com",
                name: "Test User"
            }
        });
    }

    console.log(`... generating Blueprint for User: ${user.id} ...`);

    try {
        const course = await CourseService.generateCourseBlueprint(
            user.id,
            "Node.js",
            "Understand backend fundamentals",
            "Beginner"
        );

        console.log("Blueprint Generated!");
        console.log("Course ID:", course.id);
        console.log("Modules Created:", course.modules.length);

        if (course.modules.length > 0) {
            console.log("First Module:", course.modules[0].title);
            console.log("Chapters in First Module:", course.modules[0].chapters.length);

            if (course.modules[0].chapters.length > 0) {
                const firstChapter = course.modules[0].chapters[0];
                console.log("Concepts in First Chapter:", firstChapter.concepts.length);

                // Now test Content Generation for this chapter
                console.log("\n... Generating Content for First Chapter ...");
                const content = await CourseService.generateChapterContent(firstChapter.id);
                console.log("Content Generated!", JSON.stringify(content, null, 2).substring(0, 500) + "...");
            }
        }

    } catch (error) {
        console.error("DB Gen Error:", error);
    }
}

testDBCourseGen();
