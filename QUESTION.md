## Research question

How can an AI preserve user agency without asking permission for every action?

## Hypothesis

An AI can preserve user agency without asking permission for every action if its behavior is determined by properties of the action and its context, rather than tool use alone.

## Why this matters

AI systems are increasingly able to take actions, not just generate responses. If they ask permission before everything, they become frustrating and inefficient. If they act too freely, users can lose control.

This experiment explores whether an AI can preserve human agency based on the properties of an action: ambiguity, consequence, reversibility, external impact, and authorization.

## Who or what it might affect

This affects people using AI systems that can act on their behalf—sending messages, editing files, changing calendars, managing tasks, or performing higher-consequence actions.

It also affects designers and engineers deciding where an AI should execute directly, clarify intent, ask for confirmation, or stop.

## What I am testing

Whether an AI action policy based on properties of the action can preserve user control without requiring confirmation for every tool use.

Specifically, I am testing whether the combination of:

- ambiguity
- consequence
- reversibility
- external impact
- authorization

can produce appropriate behavior across different requests: execute, execute with recovery, clarify, confirm, or block.

I am also testing whether exposing the system’s interpretation, assessment, policy decision, and state makes its behavior easier to understand.

## What would challenge the hypothesis

The hypothesis would be challenged if:

- the same action dimensions lead to inconsistent or unintuitive decisions across scenarios
- important cases cannot be explained by the five dimensions
- users still feel a loss of control even when the policy behaves as intended
- the system asks for confirmation too often, making it frustrating
- the system acts too freely in situations people expect to approve
- contextual factors outside the action itself consistently matter more than the policy accounts for

A particularly interesting failure would be discovering that **permission cannot be decided only from properties of the current action** and also requires things like relationship context, prior authorization, user preferences, or accumulated history.

## Scope

This experiment focuses on **application-level AI behavior around tool-using actions**.

It includes:

- interpreting natural-language requests into structured actions
- assessing actions using the five dimensions
- applying a deterministic behavioral policy
- deciding whether to execute, clarify, confirm, block, or support recovery
- representing the request lifecycle with a state machine
- executing actions against a simulated environment
- making the behavioral decision visible through the interface
- evaluating the policy across a controlled set of scenarios

## Non-goals

This experiment is not trying to:

- create a production-ready autonomous assistant
- design a universal safety policy for all AI systems
- prove that five dimensions are sufficient for every domain
- expose or visualize an LLM’s internal reasoning
- make claims about model cognition or consciousness
- change or train the underlying language model
- evaluate financial, medical, legal, or other high-stakes actions at production safety standards
- build full Google Calendar, messaging, banking, or account integrations
- optimize the interface as a standalone commercial product
