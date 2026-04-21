# MorataFMS Enterprise UI/UX Playbook

This document captures the UI/UX fixes, design decisions, and debugging principles we applied while improving MorataFMS.

It is not a new product specification.
It is a working playbook for keeping the system enterprise-grade while respecting the current business workflow and data model.

## Why This Exists

MorataFMS serves a customs brokerage workflow where users do not think in purely normalized database terms.

The system workflow can still be correct while the presentation feels wrong to real users.

That happened in several places:

- the live transaction pages
- the encoder import/export pages
- the admin completed-transactions document review page
- vessel grouping and transaction hierarchy
- filter density, pagination, and queue readability

The main lesson:

Enterprise UI/UX is not about making the interface look modern only.
It is about making the system reflect how people mentally track work, without corrupting the underlying workflow.

## Core Product Decision

We did not redesign the core transaction model.

We kept the current transaction-level workflow intact and improved the presentation layer.

That means:

- BL, customs reference, and transaction records remain part of the real system workflow.
- We do not replace the normalized data structure just because users group work differently.
- We can group, sort, label, and surface records in a vessel-first way in the UI.
- We should not create new database structures unless the business process truly requires new data, not just a different view.

## Business Interpretation We Aligned On

### 1. Vessel-first is a tracking model, not necessarily the persistence model

In customs brokerage operations, staff often identify work by:

- vessel
- voyage
- arrival or departure context
- client
- BL or customs reference once they drill down

That means users often want:

- vessel at the top
- transactions nested inside
- transaction identifiers visible inside the vessel group

This does not mean vessel should replace transaction identity in the database.

### 2. Document review is post-completion review, not forced archiving

The admin-side document page should not feel like the only goal is to archive quickly.

The better framing is:

- completed transactions review
- exception checking
- records readiness monitoring
- archive action available when appropriate

This aligns better with real operations because archiving is an outcome, not the whole job.

### 3. Enterprise users need hierarchy more than decoration

The original layouts often made parent and child records feel visually equal.

That caused confusion when a vessel contained multiple records.

The fix was not adding more cards or more labels.
The fix was making structure obvious:

- vessel group as the parent row
- transaction rows visibly inset underneath
- strong but restrained guide lines
- reduced duplicate statuses
- denser, cleaner transaction rows

## MorataFMS UI/UX Fixes Applied

## 1. Admin Completed Transactions / Document Review

### Problems we identified

- The page felt split in half and visually suffocating.
- KPI cards consumed too much space for the value they added.
- The page language pushed archiving too early.
- Filters were scattered and consumed too much horizontal space.
- Queue rows repeated too much status information.
- The selected detail pane repeated data already shown in the queue.
- The vessel group and the transactions under it did not have enough visual hierarchy.

### Fixes we applied

- Reframed the page as a completed-transactions review workspace rather than an archive-first screen.
- Reduced noisy and redundant copy.
- Consolidated filter behavior into a cleaner filter trigger and filter panel.
- Added explicit pagination with page navigation and page-size control instead of a passive count line only.
- Grouped completed transactions by vessel in the queue presentation.
- Simplified queue rows by removing repeated status pills and repeated document counts when they were not adding decision value.
- Reduced oversized KPI cards and removed KPIs that simply restated completion.
- Simplified the selected detail header so it focuses on the record identity and actionable context.
- Removed repeated status indicators in the detail pane where the queue already carried the signal.
- Strengthened the nested hierarchy under each vessel group using inset child rows and a visible guide line.
- Improved light and dark mode contrast for group nesting.

### Enterprise principle behind those fixes

When the page already has a queue and a detail pane, the queue should do identification and prioritization.
The detail pane should do inspection and action.

If both panes repeat the same status language, the layout becomes noisy and slower to scan.

## 2. Encoder Import and Export Pages

### Problems we identified

- The grouped-by-vessel view still looked like a flat table.
- Child transactions did not feel clearly subordinate to the vessel row.
- Previous header copy explicitly talked about "vessel first" in a way that sounded like a design explanation instead of a business interface.

### Fixes we applied

- Kept the current transaction workflow intact.
- Improved the grouped vessel hierarchy using an inset child panel under the vessel header.
- Added a visible nested guide line similar to the completed-transactions review page.
- Updated page copy to be more neutral and product-facing, not implementation-facing.

### Enterprise principle behind those fixes

Users should feel the structure immediately.

They should not need to infer:

- what is the vessel
- what is the transaction
- which lines belong together

Hierarchy should be visible from spacing, grouping, and border treatment before the user reads labels.

## 3. Transaction Oversight

### Problems we identified

- Group headers and child transactions did not feel distinct enough.
- Some export filtering states could still show misleading type labels beside vessel rows.
- The grouping logic needed to respect the visible mode more clearly.

### Fix direction

- Keep vessel grouping as the operational overview.
- Keep transaction rows as the actionable unit.
- Avoid misleading type badges if the active filter or group does not truly justify them.
- Use vessel-level summary labels only when they represent the whole visible group accurately.

### Enterprise principle behind those fixes

Labels must describe the visible truth of the current view.

If a badge says `Import` while the filtered view is export-only, that is worse than having no badge at all.

## 4. Live Tracking

### Problems we identified

- Dark mode was visually inconsistent.
- Some pages kept white background behavior in dark mode, which broke the perceived quality of the interface.

### Fixes we applied

- Corrected the page background tokens so dark mode uses the intended surface hierarchy.
- Preserved the existing workflow while making the visual shell consistent.

### Enterprise principle behind those fixes

Enterprise software is judged heavily on polish and consistency.

If dark mode looks partially broken, users read that as instability, not just as a visual issue.

## Design Decisions We Intentionally Did Not Make

These are just as important as the changes we made.

### We did not redesign the database around vessel

Reason:

- vessel is useful for tracking and grouping
- the underlying transaction record still needs its own identity and lifecycle
- replacing transaction identity with vessel identity would make the system less precise

### We did not make archive the dominant purpose of the admin completed-transactions page

Reason:

- review, compliance, and readiness come before archiving
- "send to records" or archive should be available, not visually over-prioritized

### We did not keep redundant status indicators just because they were technically correct

Reason:

- enterprise UX is about decision support, not maximum metadata density
- repeated labels slow scanning and make the page feel heavier than it is

## MorataFMS System Design Guidance

Use these rules when continuing UI/UX work in this product.

### Rule 1. Keep workflow truth in the data model

Do not redesign the schema unless the business process itself changed.

If the user needs:

- vessel-first tracking
- ED-oriented recognition
- transaction grouping

first ask whether that is:

- a data-model issue
- or a presentation issue

Most of the time in MorataFMS, it is a presentation issue.

### Rule 2. Let the UI mirror how brokerage staff search mentally

Show high-signal identifiers in the order users naturally look for them.

Typical order:

1. Vessel or voyage context
2. Transaction list under that vessel
3. BL, customs ref, client, assignee
4. status, remarks, readiness, timestamps

### Rule 3. Do not let labels imply false certainty

Examples of risky labels:

- showing a single arrival date at vessel level when the group contains mixed dates
- showing a type badge that does not accurately describe the visible records
- showing "required docs" in a completed view when completion already implies the milestone

If the label can mislead, simplify it or remove it.

### Rule 4. Favor operational clarity over dashboard decoration

Use cards only when they help answer a real operational question.

If a KPI merely repeats the state already obvious in the list:

- remove it
- compress it
- or move it into secondary detail

### Rule 5. Keep queue rows compact and decision-oriented

Rows should answer:

- what is this record
- who owns it
- is there an exception
- is action needed
- how recent is it

Anything beyond that belongs in the detail pane or a secondary disclosure.

## Enterprise UI/UX Checklist For This System

Before approving a UI change, check:

- Does the page reflect how brokerage staff actually identify work?
- Is the workflow still correct even if the UI is easier to scan?
- Are parent-child relationships visually obvious?
- Are filters consolidated and easy to clear?
- Are labels truthful for the exact current view?
- Is pagination explicit for large datasets?
- Is dark mode fully consistent?
- Are KPIs helping decisions or just occupying space?
- Is the page title describing the business purpose instead of the implementation detail?
- Are we showing fewer but more meaningful statuses?

## Where To Search For Enterprise-Grade UI/UX

When designing operational dashboards, queues, data tables, filters, and review screens, start with mature design systems and research-backed UX sources instead of random dribbble shots.

### Best places to search

#### 1. Carbon Design System

Best for:

- enterprise tables
- dense operational layouts
- filter toolbars
- pagination
- accessibility

Useful links:

- [Carbon Data Table](https://carbondesignsystem.com/components/data-table/usage/)
- [Carbon Pagination](https://carbondesignsystem.com/components/pagination/usage/)

Why it matters for MorataFMS:

Carbon is one of the strongest references for enterprise-heavy interfaces with dense transactional data.

#### 2. Atlassian Design System

Best for:

- queue layouts
- expandable hierarchies
- nested table structures
- content design for operational software

Useful links:

- [Atlassian Dynamic Table](https://atlassian.design/components/dynamic-table/)
- [Atlassian Table Tree](https://atlassian.design/components/table-tree/)
- [Atlassian Pagination](https://atlassian.design/components/pagination)
- [Atlassian Content Design](https://atlassian.design/get-started/content-design)

Why it matters for MorataFMS:

Atlassian patterns are good references for balancing clarity, density, and hierarchy in business applications.

#### 3. U.S. Web Design System

Best for:

- pagination semantics
- accessibility-first components
- plain, trustworthy interaction patterns

Useful links:

- [USWDS Pagination](https://designsystem.digital.gov/components/pagination/)

Why it matters for MorataFMS:

Even when the interface is more enterprise than public-sector, USWDS is strong for structure and accessibility discipline.

#### 4. VA Design System

Best for:

- faceted search
- filter visibility
- active filter patterns

Useful links:

- [VA Search Filter](https://design.va.gov/components/search-filter)

Why it matters for MorataFMS:

The filter pattern is especially relevant for document review queues and transaction search screens.

#### 5. Nielsen Norman Group

Best for:

- interaction research
- terminology and labeling guidance
- filters and faceted search principles
- enterprise UX reasoning

Use NNGroup mainly for principles, not visual imitation.

Suggested search topics on NNGroup:

- `site:nngroup.com faceted filters`
- `site:nngroup.com enterprise application ux`
- `site:nngroup.com dashboard design`
- `site:nngroup.com tables usability`

## Search Queries That Work Well

When doing UI/UX research for MorataFMS, use problem-based queries instead of visual-style-only queries.

Good search examples:

- `enterprise data table filter toolbar design system`
- `expandable table hierarchy enterprise ui`
- `faceted search active filters design system`
- `admin review queue enterprise ui`
- `completed transactions dashboard pagination design`
- `operations dashboard dark mode design system`
- `dense enterprise table accessibility`

Avoid relying on:

- `modern dashboard inspiration`
- `notion style table`
- `21st dev dashboard`
- `beautiful admin panel`

Those can help visually, but they are weak references for real operational software.

## How To Debug Future UI/UX Issues In This System

Use this sequence:

1. Identify whether the complaint is about workflow or presentation.
2. Ask what real users call the record when they are doing the work.
3. Map that mental model to UI grouping, not automatically to schema changes.
4. Check whether labels are truthful for mixed groups.
5. Remove redundant statuses before adding new status pills.
6. Make hierarchy visible with spacing, indentation, and border structure.
7. Only add KPI cards if they change a real decision.
8. Ensure pagination and filters scale to 50 to 100+ records.
9. Check dark mode and empty states before considering the work done.
10. Validate that the final page still respects the actual system workflow.

## Final MorataFMS Position

For this system, the correct direction is:

- keep the core transaction workflow
- keep normalized backend logic
- improve enterprise presentation
- group operationally by vessel where it helps users track work
- keep the transaction record as the actionable unit
- make review pages about review first, archive second

That is the balance between enterprise-grade UX and system integrity.
