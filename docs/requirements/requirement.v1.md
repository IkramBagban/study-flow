
- follow ./skills/SKILL.md
- follow all the best practices of next.js, file structure, rest api, frontend, react, nextjs, prisma and postgres, and ai engineer and architecture and memory. 

## TechStack: 
    - tailwindcss (✅installed/setup)
    - shadcn (✅installed/setup)
    - tanstack query
    - next.js (✅installed/setup)
    - (nodejs(bun), express)  when needed
    - posgres db with prisma orm
    - zod, bcrypt, jwt when needed. 
    - langraph, langchain
    - redux toolkit for statemanagement
    - for small state management can use contxtapi
    - better auth  (✅installed/setup)
    - turbo repo for mono repo (✅installed/setup)
    - bun env (✅installed/setup)
    - motion maybe for motion


## Requirements
1. auth create signin signup using better auth
    - create a basic signin, signup page(name, email, password, age)

2. Data Source Ingestion (Create Space Modal)
   - UI should match the "Audio/Video Overview" style (Dark, premium, glassmorphism)
   - Features:
     - Search bar for web sources
     - Dropdown/Tabs for source types: Web, Fast research
     - Drag & drop file area
     - Action buttons: Upload files, Websites, Drive, Copied text
     - Usage progress bar (e.g. 10/50)


3. Implement langraph/langchain whatever is needed. currently we would focus on paste text only, would implement working functionality for other later. 
    - install langchain, langgraph, 
    - when user tells what he wants to learn, and how much level knowledge he has, and how much time he wants to spend on learning, and what is his goal. and paste the text. then the UI AI should generate a bunch of mcqs for him, which he can give answer of. then after this a set of judgment AI should ask weather all are corect or not. also update UI when needed, and should be consistent all around the app. theme, color fonts etc. 
4. course design
    - Now it's time to generate a course based on the user understanding. the course would have everything that we should teach and we'll be more focusing on where user is week. we would follow all the practices for course generate backed by neuro science and psychology. read @docs, and my converstion with gpt at @conversation_with_gpt.md



5. Diagram, charts, drawing
    - he as you know without diagram, charts, drawing, visualization it's hard to explain something. so we would need to implement this. we would use AI to generate this. 
    - so implement the feature and tools so when AI need to generate diagram, charts, drawing, visualization it should be able to generate it. 
    - use mermaid, d3.js,  recharts, svg, etc
    - and let AI use them whenever needed. write modular code so it can be used in any part of the app. 

6. Courses on dashboard
    - should be able to see all the courses on dashboard. 

7. Full Flow
    - the full flow should work now.
    - when user creating the course, he can tell what he want to learn, upload resources (currently paste text), and tells the understanding level(this will not be asked for each resource but for all the resources and that topic.), the AI will generate some points related to that topic which user has said, and also the main source for AI would be user uploaded resource (if uploaded). then based on resource and user knowledge level some list of some points (concepts) would be generated. and then user will tell what he knows and what he doesn't know, there will be simply a checkbox or right/wrong icons. then based on all these data, AI will generate a quiz, that will ask him concepts that he knows, and also related questions of that topic, and resouces (primary source would be resources), and this whole quiz would be generated on the given resources(if uploaded enough), or you can generte, the main motive of this quiz would be to know the user's knowledge and understanding about that topic he want to learn. and then based on all these data, you'll make some judgement about users understanding and knowledge level. and then the platform will show user a list of judgement that he has made about that user, and want cross confirm from user himself(this will exactly help us understand users knowledge, understanding and other details). user will confirm what points are right or wrong, then after this, the personalise course will start design. by considering all these parameters. 
    7. End-to-End Learning Flow (Critical)
        Step 1: Course Creation

        User:

        selects what they want to learn

        uploads resources (paste text for v1)

        sets a single overall understanding level for the topic

        Step 2: Concept Extraction

        AI:

        analyzes topic and resources

        generates a list of core concepts

        prioritizes concepts derived from user-provided resources

        User:

        marks each concept as:

        known

        unknown

        unsur
        (checkboxes or right/wrong icons)
        Step 3: Adaptive Diagnostic Quiz
        AI generates a quiz that:
        tests:
        known concepts

        related concepts
        prerequisite ideas
        uses:
        recall questions
        application-based questions
        limited recognition (MCQs)
        is grounded primarily in:
        user resources (if sufficient)
        internal knowledge (fallback)
        Primary goal:
        Accurately infer the user’s real understanding.
        Step 4: Judgment & Cross-Confirmation
        System:
        produces an internal judgment about:
        user knowledge level
        confidence
        gaps
        misconceptions

        presents this judgment to the user
        asks the user to confirm or correct it
        This step exists to increase accuracy of the learning model.

        Step 5: Personalized Course Generation
        After confirmation:
        learning map is finalized
        personalized course is generated
        adaptive learning begins
        From this point:
        the system controls learning direction
        the user controls pace
        Core Principle (Internal)
            The system’s job is not to teach content.
            Its job is to model understanding and decide what should happen next.

