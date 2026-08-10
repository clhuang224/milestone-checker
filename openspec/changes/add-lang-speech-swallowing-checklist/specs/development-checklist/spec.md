# Spec delta: development-checklist (ADDED)

## ADDED Requirements

### Requirement: Hierarchical checklist structure
The system SHALL organize milestones under major categories (language, speech, swallowing), each containing sub-items.

#### Scenario: Viewing a category
- **WHEN** a user opens the checklist page
- **THEN** they see the three major categories, each expandable to show its sub-items

### Requirement: Achievement recording
The system SHALL let a user mark a sub-item as achieved and record the date it was achieved.

#### Scenario: Marking a milestone achieved
- **WHEN** a user checks off a milestone sub-item
- **THEN** they are prompted for (or can edit) the achievement date
- **AND** the date is persisted alongside the milestone

### Requirement: Suggested activities
The system SHALL optionally display suggested at-home activities for a milestone, when available.

#### Scenario: Milestone with suggestions
- **WHEN** a milestone has `suggestedActivities` defined
- **THEN** those suggestions are visible near the milestone item

### Requirement: Observation log
The system SHALL let a user add free-text dated notes independent of the structured checklist.

#### Scenario: Adding a note
- **WHEN** a user writes a note in the observation log and saves it
- **THEN** the note is persisted with its date and shown in the log going forward

### Requirement: Local-only persistence
The system SHALL persist all data in the browser's `localStorage` only, with no backend or account system.

#### Scenario: Reloading the page
- **WHEN** a user reloads the page after recording data
- **THEN** all previously recorded checklist and observation data is still present

### Requirement: Reference-only disclaimer
The system SHALL display a persistent, non-dismissible-into-oblivion notice that the checklist is for reference only and not a diagnostic tool.

#### Scenario: Any page view
- **WHEN** a user views any page of the app
- **THEN** the disclaimer is visible (not hidden behind a menu or shown only once)

### Requirement: Scope limited to language/speech/swallowing
The system SHALL, in this change, only include content for the language, speech, and swallowing categories — not other developmental domains.

#### Scenario: Category list
- **WHEN** viewing the list of major categories
- **THEN** only language, speech, and swallowing are present (other domains are out of scope until a future change adds them)
