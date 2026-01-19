---
description: Review user stories for a phase to ensure all acceptance criteria are covered
argument-hint: [phase]
model: claude-3-5-haiku-20241022
---

You are reviewing work for a specific delivery **phase**.

The current phase is: **$1**

User stories and requirements for this phase can be found in:
- ./docs/$1

Tasks:
1. Read all relevant user stories and acceptance criteria in ./docs/$1.
2. Infer the intended behavior, constraints, and edge cases from those user stories.
3. Review the implementation or planned work for this phase and:
   - Verify that every acceptance criterion for this phase is implemented or explicitly addressed.
   - Call out any acceptance criteria that appear missing, partially implemented, or ambiguous.
   - Highlight any technical or UX risks that might cause criteria to be failed in practice.
4. Provide:
   - A checklist mapping each acceptance criterion to the corresponding code, file(s), or planned work.
   - Concrete suggestions or follow-up tasks for any gaps you find.
   - Write the instructions in a file called qa-instructions.md in the same directory as the user stories for this phase.
