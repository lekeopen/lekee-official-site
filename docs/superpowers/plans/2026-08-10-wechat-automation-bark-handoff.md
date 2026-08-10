# WeChat Automation Bark Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the weekly and monthly WeChat automations produce copyable drafts and push a Bark review reminder, while keeping manual publishing as the default.

**Architecture:** Update the two existing cron automation prompts in `.codex/automations` instead of adding a new workflow. The weekly job should continue the operational check and, when a post is worth sending, emit a ready-to-review draft plus a Bark handoff reminder. The monthly job should produce the monthly schedule and draft skeletons, then also remind the user through Bark that review is needed. No publish or menu mutation is added.

**Tech Stack:** Codex automation TOML prompts, existing WeChat admin content files, xiaoke `monitor-service` Bark notification helper, markdown text output.

## Global Constraints

- Do not auto-publish to WeChat.
- Do not call WeChat modification APIs from the automation prompts.
- Keep manual review as the approval gate.
- Use Bark for the review notification path.
- Keep changes confined to automation configuration and supporting notes.

---

### Task 1: Define the notification handoff

**Files:**
- Modify: `/Users/rockts/.codex/automations/automation/automation.toml`
- Modify: `/Users/rockts/.codex/automations/automation-2/automation.toml`

**Interfaces:**
- Consumes: current weekly/monthly prompts and the xiaoke Bark helper path
- Produces: prompt text that instructs the future automation run to generate draft output and send a Bark review reminder

- [ ] **Step 1: Add explicit draft-output requirements to the weekly prompt**
- [ ] **Step 2: Add explicit draft-output requirements to the monthly prompt**
- [ ] **Step 3: State manual publishing as the default end state**
- [ ] **Step 4: Include Bark reminder wording in both prompts**

### Task 2: Record the operational decision

**Files:**
- Modify: `/Users/rockts/.codex/automations/automation/memory.md`
- Modify: `/Users/rockts/.codex/automations/automation-2/memory.md`

**Interfaces:**
- Consumes: the updated prompt behavior
- Produces: persistent notes that future runs can reuse without re-deriving the same decision

- [ ] **Step 1: Note that weekly runs should end with a review reminder**
- [ ] **Step 2: Note that monthly runs should emit draft skeletons**
- [ ] **Step 3: Record that Bark is the review notification channel**

### Task 3: Verify the final shape

**Files:**
- Modify: none

**Interfaces:**
- Consumes: edited TOML and memory files
- Produces: a quick human-readable confirmation that the automation now stops at review unless manually advanced

- [ ] **Step 1: Re-read the edited prompts**
- [ ] **Step 2: Confirm no prompt contains auto-publish language**
- [ ] **Step 3: Confirm both prompts still remain read-only on WeChat**
