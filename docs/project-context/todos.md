[x] 1. Error Accumulation is Incomplete ✅ DONE
[x] 2. No Observability/Tracing ✅ DONE
[x] 3. Strict RAG Mode (Use Only Resources) ✅ DONE
    - Implemented UI toggle, API propagation, and Analyzer/Director node strictness.
    - Updated Diagnostic Quiz to respect strict mode.
    - Documented in `docs/technical/RAG_IMPLEMENTATION.md`.

[] 4. Recursion Limit is a Band-Aid
You set recursionLimit: 100. This is fine as a safety net, but if you're hitting high recursion counts, it signals design issues.
Recommendation: Track retryCount metrics per block type. If visuals consistently require 3 retries, your prompt needs refinement, not more loops.

[] 5. PDF Parsing Integration
    - `upload/route.ts` is currently a placeholder.
    - Need to implement PDF -> Text parsing (using `pdf-parse` or similar) to support file uploads.

[] 6. Running Context Could Overflow
Your runningContext accumulates text indefinitely. For long chapters, this could exceed context limits.
Recommendation: Implement a sliding window or summarization.

[] 7. Improve Visualizer
    - Enhance prompt engineering for diagrams.
    - Add support for more diagram types (e.g. sequence diagrams, state charts).

[] 8. Resource Management UI
    - User needs to see what files are uploaded.
    - Ability to delete resources from a course.

[] 

# for later
[] 9. rebrand project
[] 10. create waitlist
[] x. Revamp UI