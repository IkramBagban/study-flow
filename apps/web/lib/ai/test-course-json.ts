import { CourseService } from "./course-service";
import { writeFileSync } from "fs";
import { join } from "path";

async function testCourseGen() {
    console.log("Starting generation...");
    try {
        const domainMap = await CourseService.generateDomainMap("Node.js", "Understand backend fundamentals");
        const courseStructure = await CourseService.generateCourseStructure("Node.js", "Understand backend fundamentals", "Beginner");

        const result = {
            domainMap,
            courseStructure
        };

        const outputPath = join(process.cwd(), "verify_result.json");
        writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log("Done! Wrote results to " + outputPath);
    } catch (error) {
        console.error("Error during generation:");
        console.error(error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
    }
}

testCourseGen();
