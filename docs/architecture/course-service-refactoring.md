# Course Service Refactoring - Architecture Documentation

## 📋 Problem

The original `course-service.ts` was **~475 lines** doing too much:
- Domain map generation
- Course structure creation  
- Chapter content generation
- Streaming logic
- Database operations
- JSON parsing/validation

This violated the **Single Responsibility Principle** and made the code hard to maintain.

## ✅ Solution: Service Layer Pattern

Broke down the monolithic service into **focused, specialized services**:

```
lib/ai/
├── course-service.ts              (70 lines) - Facade/Entry point
├── services/
│   ├── course-structure-service.ts   (180 lines) - Domain maps & course creation
│   └── chapter-generation-service.ts (240 lines) - Content generation & streaming
├── agents/
│   ├── director-agent.ts
│   ├── professor-agent.ts
│   ├── visualizer-agent.ts
│   └── inquisitor-agent.ts
└── core/
    ├── agent-base.ts
    └── agent-config.ts
```

## 🏗️ New Architecture

### 1. **CourseService** (Facade)
**Location:** `lib/ai/course-service.ts`  
**Lines:** ~70  
**Purpose:** Main entry point that delegates to specialized services

```typescript
// Simple, clean interface
CourseService.createCourse(...)           → CourseStructureService
CourseService.generateChapterContent(...) → ChapterGenerationService
CourseService.generateChapterContentStream(...) → ChapterGenerationService
```

**Benefits:**
- ✅ Existing code doesn't break (same API)
- ✅ Easy to understand what operations are available
- ✅ Single import for consumers

### 2. **CourseStructureService**
**Location:** `lib/ai/services/course-structure-service.ts`  
**Lines:** ~180  
**Responsibility:** Course creation and structure

**Methods:**
- `generateDomainMap()` - Phase A: Topic analysis
- `generateCourseStructure()` - Phase B: Modules/chapters
- `createCourse()` - Save to database

**Why separate:**
- Course structure generation is **infrequent** (once per course)
- Different AI prompts and validation logic
- Can be tested/modified independently

### 3. **ChapterGenerationService**  
**Location:** `lib/ai/services/chapter-generation-service.ts`  
**Lines:** ~240  
**Responsibility:** Content generation for chapters

**Methods:**
- `generateChapterContent()` - Standard generation
- `generateChapterContentStream()` - SSE streaming version
- `generateBlocks()` - Private: Execute task plan
- `generateBlocksStreaming()` - Private: Streaming version
- `generateSingleBlock()` - Private: Generate one block

**Why separate:**
- Chapter generation is **frequent** (multiple times per course)
- Different workflow (multi-agent coordination)
- Streaming logic isolated
- Can optimize independently

## 📊 Comparison

| Metric | Before | After |
|--------|--------|-------|
| Main service lines | 475 | 70 |
| Largest service | 475 | 240 |
| Services | 1 | 3 |
| Responsibilities per service | 6+ | 1-2 |
| Code duplication | High | None |

## 🎯 Benefits

### 1. **Single Responsibility**
Each service has ONE clear purpose:
- `CourseService` → Facade/API
- `CourseStructureService` → Structure creation
- `ChapterGenerationService` → Content generation

### 2. **Easier Testing**
```typescript
// Test structure generation independently
test('generates valid domain map', () => {
    CourseStructureService.generateDomainMap(...)
});

// Test content generation independently  
test('handles partial block failures', () => {
    ChapterGenerationService.generateChapterContent(...)
});
```

### 3. **Better Code Reuse**
```typescript
// Private methods eliminate duplication
generateSingleBlock()    // Used by both streaming & non-streaming
generateBlocks()         // Reusable block execution
generateBlocksStreaming() // Streaming variant
```

### 4. **Easier to Modify**
Want to change streaming logic? → Edit `ChapterGenerationService` only  
Want to change domain AI prompts? → Edit `CourseStructureService` only  
Both are isolated!

### 5. **Scalability**
Easy to add new services:
```
services/
├── course-structure-service.ts
├── chapter-generation-service.ts
├── assessment-service.ts         ← New!
├── progress-tracking-service.ts  ← New!
└── analytics-service.ts          ← New!
```

## 🔄 Migration Impact

### ✅ **Zero Breaking Changes**

All existing code continues to work:

```typescript
// Old code still works!
import { CourseService } from "@/lib/ai/course-service";

await CourseService.createCourse(...);
await CourseService.generateChapterContent(...);
```

The facade pattern ensures **backward compatibility**.

## 📝 Design Principles Applied

1. **Single Responsibility Principle (SRP)**
   - Each service has one reason to change

2. **Open/Closed Principle**
   - Open for extension (add new services)
   - Closed for modification (existing services stable)

3. **Dependency Inversion**
   - Services depend on abstractions (agents)
   - Not coupled to each other

4. **Interface Segregation**
   - Consumers import only what they need
   - Clear, focused APIs

5. **DRY (Don't Repeat Yourself)**
   - `generateSingleBlock()` eliminates duplication
   - Common logic centralized

## 🚀 Next Steps (Optional)

Consider adding:

1. **Error Service** - Centralized error handling
2. **Cache Service** - Cache AI responses
3. **Queue Service** - Background job processing
4. **Analytics Service** - Track generation metrics

## 📈 Metrics to Track

Monitor these to validate the refactoring:

- [ ] Time to add new features (should decrease)
- [ ] Bug rate in services (should decrease)
- [ ] Test coverage (should increase)
- [ ] Code review time (should decrease)

## ✨ Summary

**Before:** One massive 475-line service doing everything  
**After:** Three focused services with clear responsibilities

**Result:** 
- ✅ More maintainable
- ✅ Easier to test
- ✅ Easier to extend
- ✅ No breaking changes
- ✅ Better developer experience

**Files to import:**
```typescript
// Always use the facade
import { CourseService } from "@/lib/ai/course-service";
```

Individual services are implementation details and should not be imported directly by application code.
