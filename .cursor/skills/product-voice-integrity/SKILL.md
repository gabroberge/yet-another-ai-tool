---
name: product-voice-integrity
description: >
  Audit and improve user-facing product copy.
  Detect design-rationale leakage, prompt contamination,
  implementation narration, and unnecessary explanation
  in application interfaces. Preserve product voice,
  user intent, domain terminology, and functional accuracy.
---

# Product Voice Integrity

## Purpose

Ensure that every user-facing string belongs to the
product experience rather than to the process that
created the product.

Treat UI copy as part of product design, not as
documentation of the agent's reasoning.

## Core distinction

Separate three kinds of information:

1. Product reality: what the product does, offers,
   reports, or communicates to its users.
2. User guidance: what users need to know to understand
   the current state or take an action.
3. Production rationale: why a designer, developer,
   stakeholder, or AI agent chose to build something.

The first two may belong in the interface.

The third normally does not, unless the product
explicitly exists to present such rationale.

## Required workflow

### 1. Understand the product

Before rewriting copy:

- Read the relevant product documentation.
- Identify the intended audience.
- Understand the user's actual tasks.
- Identify the product's voice and terminology.
- Inspect the behavior associated with the copy.
- Distinguish intentional product claims from
  implementation details and design instructions.

Do not infer product behavior from marketing copy alone.

### 2. Inventory user-facing strings

Inspect:

- Navigation and page headings
- Buttons and form labels
- Descriptions and supporting text
- Empty, loading, success, and error states
- Tooltips and notifications
- Onboarding and settings
- Dashboard metrics and explanations
- Generated content and templates

Include dynamically generated strings, not just
hardcoded UI text.

### 3. Classify each string

Classify as:

- Functional: necessary for an action or comprehension
- Product voice: legitimate product communication
- Technical: meaningful technical information
- Rationale leakage: explanation of design decisions
- Prompt contamination: instructions or creative
  constraints exposed as product copy
- Implementation narration: commentary on how
  the interface or underlying code was built
- Redundant: text with no identifiable user purpose
- Uncertain: requires product or domain clarification

A technical detail is not automatically leakage.

### 4. Diagnose before rewriting

For every suspicious string, ask:

- Who is speaking?
- Who is the intended reader?
- What does the reader need from this string?
- Would this sentence still exist if the author had
  never seen the implementation prompt?
- Does it describe the product, or justify its creation?
- Does it tell the user something relevant and true?
- Is it consistent with the established product voice?

Do not use generic "sounds AI-generated" judgments
without identifying a concrete problem.

### 5. Rewrite with minimal semantic drift

Prefer, in order:

1. Keep the existing copy if it already works.
2. Remove text that has no user-facing purpose.
3. Rewrite text that communicates a legitimate idea
   from the wrong perspective.
4. Request clarification when product intent is unclear.

Preserve:

- Functional meaning
- Product terminology
- Accessibility
- Genuine technical transparency
- Important warnings and limitations
- Legal or regulatory content
- Deliberate fictional or satirical voice

Do not invent product capabilities or claims.

### 6. Validate in context

Review the rendered interface after changes.

Check:

- Text hierarchy and visual fit
- Meaning alongside adjacent controls
- Empty and error states
- Consistency across screens
- Accessibility and translation implications
- Claims against actual product behavior

Do not declare success based only on edited files.

## Special rule: fictional and satirical products

Maintain the fictional company's internal point of view.

Do not explain the satire, reveal the author's intention,
or turn the creative brief into product copy.

Do not remove deliberate contradictions merely because
they appear irrational from outside the fictional world.

The product may be absurd without acknowledging it.

## Output

Provide a concise summary of:

- Significant contamination patterns
- Meaningful edits made
- Ambiguous strings requiring clarification
- Product claims that could not be verified

Do not introduce a numerical quality score
unless there is a validated measurement method.
