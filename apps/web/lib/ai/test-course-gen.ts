import { CourseService } from "./course-service";

async function testCourseGen() {
    console.log("... Testing Domain Map Generation for 'Node.js' ...");
    try {
        const domainMap = await CourseService.generateDomainMap("Node.js", "Understand backend fundamentals");
        console.log("Domain Map Result:", JSON.stringify(domainMap, null, 2));
    } catch (error) {
        console.error("Domain Map Error:", error);
    }

    console.log("\n... Testing Course Structure Generation for 'Node.js' ...");
    try {
        const courseStructure = await CourseService.generateCourseStructure("Node.js", "Understand backend fundamentals", "Beginner");
        console.log("Course Structure Result:", JSON.stringify(courseStructure, null, 2));
    } catch (error) {
        console.error("Course Structure Error:", error);
    }
}

testCourseGen();
