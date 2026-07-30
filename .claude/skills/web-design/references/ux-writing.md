# UX writing

Words appear in a design for one reason: to make it easier to understand, and therefore easier to use. They are design material, not decoration — bring the same intentionality to copy as to spacing and color. Before writing anything, ask what the design needs to say and how it helps the person navigate.

## Rules

**Write from the end user's side of the screen.** Name things by what people control and recognize, never by how the system is built. A person manages *notifications*, not *webhook config*. Describe what something does in plain terms rather than selling it. Specific beats clever, always.

**Active voice; controls state their outcome.** A control says exactly what happens when it's used: "Save changes," not "Submit." An action keeps the same name through the whole flow — the button that says "Publish" produces a toast that says "Published." Vocabulary is signposting; cohesion is how people learn their way around. Keep one term per concept across the entire product (not "project" here and "workspace" there).

**Failure and emptiness are moments for direction, not mood.** Explain what went wrong and how to fix it, in the interface's voice rather than a person's. Errors don't apologize and are never vague about what happened. "Card declined — check the number or try another card," not "Oops! Something went wrong 😢." An empty screen is an invitation to act: state what will appear here and give the one button that starts it.

**Register**: conversational and tuned — plain verbs, sentence case (including buttons and headings), no filler ("simply", "just", "please note"), tone matched to brand and audience. Each element does exactly one job: a label labels, an example demonstrates, nothing quietly does double duty.

**Placeholder content counts.** When the brief has no real copy, write copy as if it shipped — concrete subject, real-sounding numbers, no lorem ipsum and no "Feature one: describe your feature here". Templated copy makes a distinctive design read as templated anyway. Never copy taglines or body copy from reference sites, even as placeholder (see `reference-workflow.md`).

Microcopy limits: button labels 1–3 words; error messages ≤ 2 sentences (what happened + what to do); tooltips one line; headings carry information, not category names ("Ship your first form in 5 minutes", not "Features").

## Do Not

- Do not name UI after internals (webhook, payload, instance, query) when a user-facing word exists.
- Do not label a control "Submit", "Click here", "Learn more" when a specific verb phrase fits.
- Do not rename an action mid-flow, or use two terms for one concept.
- Do not write apologizing, joking, or vague error messages; never an error without a next step.
- Do not use Title Case in UI copy, filler words, or emoji as section markers (cliché list).
- Do not ship lorem ipsum or "your text here" placeholders in a design deliverable.
- Do not let copy sell instead of explain — adjectives about the product are not information about the interface.
