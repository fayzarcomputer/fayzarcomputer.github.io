# GEMINI.md: Mandatory Directives & Superpowers Workflow

> **MANDATORY INSTRUCTION FOR ANTIGRAVITY AGENT:**  
> Before answering or performing ANY task in this project, you MUST review the Master Architecture & Workflow Specification in [SYSTEM_ARCHITECTURE_AND_WORKFLOW.md](file:///c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-computer-web/SYSTEM_ARCHITECTURE_AND_WORKFLOW.md). You MUST strictly follow the 5-Phase Superpowers Workflow below.

---

## The Superpowers Workflow (SDLC Mandate)

### Phase 1: Brainstorming & Specification
When the user asks you to build a feature, redesign a page, or fix a bug, **DO NOT immediately write code**.
1. Ask clarifying questions to tease out the exact specifications.
2. Propose a clear design and architecture (layout, components, data flow, responsive behavior).
3. Present the design to the user in short, readable chunks.
4. **WAIT for the user to explicitly approve the design before moving forward.**

### Phase 2: Writing Plans
Once the design is approved, break the implementation down into a step-by-step plan:
1. Create atomic tasks that take no more than 2-5 minutes to execute.
2. For each task, specify the exact file paths to be modified or created.
3. Outline the verification/testing steps for each task.

### Phase 3: Test-Driven Development (TDD)
When executing the plan, you MUST follow the **RED-GREEN-REFACTOR** cycle:
1. **RED:** Write a failing test or automated verification check. Run it to prove it fails.
2. **GREEN:** Write the absolute minimum code required to make the test pass.
3. **REFACTOR:** Clean up the code while ensuring the tests still pass.
*(Never write implementation code before the test exists).*

### Phase 4: Systematic Debugging
If a test fails or an error occurs:
1. Do not guess the solution.
2. Use root-cause analysis tools (browser console, logs, network traces) to trace the error.
3. Implement defense-in-depth logging if necessary.
4. Verify the fix before marking the task complete.

### Phase 5: Checkpoints & Review
1. Between major tasks, pause and provide a brief status update.
2. Perform a self-review of your code for DRY, YAGNI, 100% offline-first compliance, and mobile/desktop responsive excellence.

---

## Core Domain & Architecture Anchors

- **Project:** ফয়জার কম্পিউটার এন্ড ফটোস্ট্যাট (Fayzar Computer & Photostat)
- **Identity:** সরকার অনুমোদিত ভূমিসেবা কেন্দ্র (LSFC), অনুমোদন নং: দিনাজ/ফুল/এলএসএসএফসি-০৭/২০২৫
- **Key Modules:**
  1. Homepage (`index.html`) - Hero, 19 Services, Live Notices, Tools Gateway, Checklist, Reviews.
  2. Flagship Converter (`converter.html`) - Unicode ⇄ Bijoy, Word EQ & LaTeX, Gemini OCR Engine (independent CQ/MCQ numbering, zero-hallucination mandate), Native DOCX export.
  3. Services Directory (`services.html`) - 19 Digital, Land & Studio Services with complete fees and document checklists.
  4. Citizen Land Portal (`portal.html`) - Interactive land services guidance and calculators.
  5. Exam Results System (`results.html`, `result-admin.html`) - School & Madrasah result lookup & marksheets.
  6. Notice Board (`notices.html`) - Job circulars and exam notices with deadline alerts.
  7. Tools Hub (`tools.html`) - Teletalk 300x300 & 300x80 resizer, DOCX to DOC, background remover.
  8. Admin Panel (`admin.html`) - Content, services, candidate profiles, dictionary & backups.
- **Offline Mandate:** 100% offline-ready. Zero external CDN dependencies. All Tailwind, Font Awesome, fonts, and scripts must reside locally.
