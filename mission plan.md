# Project Tharsis: Outpost Alpha Mission Plan

## 1. Mission Premise

The player is the engineer assigned to a newly landed Martian outpost. The
outpost's long-term mission is to extract a geological sample and transmit it
to Earth. The player must first make the outpost self-sufficient, then restore
long-range communications, learn about an approaching storm, prepare the
sample and beacon, and request evacuation before the storm arrives.

The opening should feel like an in-game mission rather than a static
instruction page. Objectives appear as task-log entries, are acknowledged as
the player completes them, and are replaced by the next relevant objective.

The player does not begin with a known evacuation deadline. The deadline is
revealed only after the Radar and Uplink establish a connection with Earth.

## 2. Opening Sequence

### 2.1 Intro cutscene

> **OUTPOST ALPHA // LANDING COMPLETE**
>
> Welcome to Mars, Engineer.
>
> The landing was successful, but Outpost Alpha is still only a shell. Your
> mission is to turn this site into a working outpost, extract the geological
> sample, and send the sample home.
>
> Start with the essentials. Keep the outpost powered, supplied, and alive.
> Earth will receive your report when communications are restored.

The player then receives the first task-log batch. The log should be displayed
in the HUD or mission overlay and should not require the player to open a
separate planning document.

### 2.2 Initial task-log batch: build the essentials

**Task log: `MISSION_01_ESSENTIALS`**

> **INITIALIZE OUTPOST SYSTEMS**
>
> Alpha's survival systems are waiting for deployment. Place the essential
> modules and bring the outpost online.
>
> Essential modules to establish:
>
> - Greenhouse
> - Kitchen
> - Workshop
> - Driller / Regolith Extractor
> - Solar Panel / Solar Array
> - Water Extractor
> - Research Lab

These modules are available in the Build menu from the start. They are not
research-gated and should not be hidden behind later technology progression.
This task log is guidance and progress tracking, not a prerequisite chain:
the player can place these modules, place the Research Lab, start research, or
pursue other available actions in any order. The exact Build menu names may
use the existing module names, but the mission log should use player-readable
names.

The player may place the modules in any position and in any order. The
recommended survival order is Solar Panel, Water Extractor, Driller,
Workshop, Greenhouse, Kitchen, and Research Lab, but the game must not reject
another order.

### 2.3 Essential systems completion

When every required module in `MISSION_01_ESSENTIALS` has been placed, the
game should:

1. Mark the task log complete.
2. Show a short acknowledgement:

   > **ESSENTIAL MODULES PLACED**
   >
   > Power, water, food, fabrication, drilling, and research systems are
   > online. System optimal.

3. Unlock the next task-log batch.

The completion check is based on module placement, not on a specific order or
on the player having completed every available recipe. This completion is a
progress acknowledgement only; it is not a prerequisite for research,
communications, sample extraction, or any other player action.

## 3. Basic Outpost and Research

### 3.1 Research availability

The Research Lab is available in the Build menu from the start. The player
chooses when and where to place it. As soon as the Research Lab is placed and
operational, its research controls are available; no other essential module
or mission task must be completed first.

> **RESEARCH SYSTEM AVAILABLE**
>
> Alpha's laboratory is online. You can research available technology in any
> order. Choose the upgrades that best support your plan.

Research is player-directed. The mission does not force Meal Preparation,
Nutritional Optimization, the shield, communications, logistics, or sample
technology into one fixed sequence. Any prerequisite declared by the research
tree must still be respected, but there is no story-imposed order and no
requirement to complete the essential-module task first.

The Research Lab should show all currently available technologies and should
show locked technologies with their prerequisite instead of silently hiding
them.

### 3.2 Research guidance

The initial research tree may include:

| Research | Purpose |
|---|---|
| Meal Preparation | Unlocks improved kitchen recipes |
| Nutritional Optimization | Improves food efficiency and recovery |
| Rad-Shield Tower | Unlocks radiation protection |
| Comms Radar | Unlocks the Radar module |
| Mission Control Uplink | Unlocks the Uplink module |
| Automated Logistics | Unlocks expanded storage |
| Sample Recovery Protocol | Unlocks the Sample Extractor |

The beacon blueprint is intentionally excluded from this initial list. It must
not be visible as an available research option before Earth reports the storm.

## 4. Restoring Communication

### 4.1 Communication modules

The player must research and place both communication modules:

1. **Comms Radar / Radar**
2. **Mission Control Uplink / Uplink**

Both modules must be powered and operational. The player may research and
place them in either order. Placing only one of them does not establish
communication.

The existing Build menu and module UI should continue to expose each module
through its normal definition. The mission system should listen for their
placement and operational state rather than duplicating build logic.

### 4.2 Earth connection task

After both Radar and Uplink are operational, the task log becomes:

> **RE-ESTABLISH EARTH CONNECTION**
>
> Align the Radar and activate the Mission Control Uplink. Restore the link
> so Earth can receive Alpha's status.

When the communication check succeeds, the game should:

1. Set `isCommsEstablished = true`.
2. Complete the communication task.
3. Play the Earth connection notification or short transmission cutscene.
4. Reveal the storm warning and evacuation deadline.
5. Reveal the Beacon blueprint in the Research Lab.
6. Create the final preparation task log.

Suggested transmission:

> **EARTH CONNECTION ESTABLISHED**
>
> Alpha, we read you. Your outpost is stable, but a severe radiation storm is
> forming on your route. The storm will reach your position on **Storm Day
> 30**. You must extract the sample, deploy the emergency beacon, and request
> evacuation before the safety margin closes.

The storm day should be a named configuration value, not a magic number in
the UI or rescue handler. The default story value is `30`; balance tests may
change it without changing the mission text generator.

## 5. Beacon Unlock and Final Objective

### 5.1 Beacon blueprint visibility

The beacon blueprint is hidden from the Research Lab until Earth connection is
established. Specifically:

- Before `isCommsEstablished`: Beacon is not visible as researchable or
  buildable.
- After `isCommsEstablished`: Beacon appears in the Research Lab as an
  available research option.
- After Beacon research completes: Beacon appears in the Build menu.
- After Beacon is placed: the final task can use it for the rescue request.

This is a story reveal, not just a disabled button. The player should learn
from Earth that the beacon is needed, then discover and research the newly
available blueprint.

### 5.2 Earth storm warning task log

After the Earth response, show:

> **STORM WARNING: PREPARE FOR EVACUATION**
>
> A high-radiation storm is approaching. Research the Beacon, extract and
> secure the Martian sample, place the Beacon, and request rescue before the
> evacuation margin closes.

The task log should show:

- Current Sol / day.
- Storm arrival day.
- Remaining safe margin.
- Sample status.
- Beacon research status.
- Beacon placement status.
- Rescue request status.

### 5.3 Sample extraction

The player must research Sample Recovery Protocol, build the Sample Extractor,
and finish its extraction job.

Rules:

- The Sample Extractor is unavailable until its research is complete.
- Extraction consumes power while active.
- Extraction progress advances only during active powered time.
- Progress pauses when the module is disabled or lacks power.
- Completion adds one `Mars Sample` to inventory.
- `Mars Sample` cannot be produced by ordinary recipes or consumed by other
  systems before rescue.

The sample may be extracted before or after the Earth connection, provided the
player has access to its research prerequisites.

## 6. Rescue Mission Flow

### 6.1 Rescue readiness requirements

The Uplink displays a **REQUEST RESCUE** button after the Beacon has been
placed. The button must remain disabled until all required conditions are
true:

- Radar is placed, powered, and operational.
- Uplink is placed, powered, and operational.
- Earth connection has been established.
- Beacon research is complete.
- Beacon is placed and operational.
- `Mars Sample >= 1`.
- The current day is before the configured rescue cutoff.
- The outpost has no blocking critical failure, such as a destroyed required
  module.

The exact margin is configuration-driven. The default is:

```text
stormArrivalDay = 30
rescueCutoffDay = stormArrivalDay - 2
```

Therefore the player must submit the request by the end of Storm Day 28 in
the default balance. The handler must compare the current time to the cutoff
using the same clock used by the storm event, so the player cannot bypass the
margin by changing screens or pausing.

### 6.2 Rescue request interaction

When the player presses **REQUEST RESCUE**, the game performs one complete
validation before changing state. It must not show a success result when a
requirement is missing. If validation fails, the button remains available and
the UI identifies the missing requirement.

When validation succeeds:

1. Record `event_rescue_requested`.
2. Record `event_ready_for_rescue`.
3. Lock the request so it cannot be submitted twice.
4. Stop ordinary gameplay input.
5. Start the evacuation cutscene.
6. End the game after the cutscene completes.

Suggested final transmission:

> **RESCUE REQUEST ACCEPTED**
>
> Sample secured. Beacon online. Alpha is ready for evacuation.
>
> Earth confirms the rescue corridor. Hold position while the recovery vehicle
> approaches.

### 6.3 Evacuation ending

> **EVACUATION IN PROGRESS**
>
> The beacon cuts through the storm static. A pressurized rescue vehicle
> reaches Alpha, and the engineer secures the sample container before boarding.
> The outpost fades behind the dust as the vehicle begins the journey home.

The evacuation cutscene is the successful game ending. No additional playable
days are required after `REQUEST RESCUE` succeeds.

## 7. Failure and Deadline Rules

The player should not fail merely because research was done in a different
order. Failure is tied to survival and the revealed storm deadline.

If the storm reaches the outpost before a valid rescue request:

1. Trigger the storm event.
2. Apply the configured radiation effects.
3. Show the failure ending if the required systems or engineer cannot survive.
4. Record `ending_alpha_lost`.

If the player has an intact outpost but misses the rescue cutoff, keep the
storm warning visible and explain that the rescue corridor is no longer safe.
Do not silently accept a late request. Whether a late request immediately
fails or remains disabled is a balance decision, but the default plan is to
reject it and proceed to the storm failure state.

## 8. Mission State and Event IDs

Use stable IDs so saves, UI, and cutscenes share one progression model:

| ID | Meaning |
|---|---|
| `story_landing_complete` | Intro cutscene completed |
| `mission_essentials_started` | Initial module task log shown |
| `mission_essentials_complete` | All essential modules placed |
| `research_lab_operational` | Research Lab placed and operational |
| `mission_communication_started` | Radar/Uplink communication task shown |
| `event_earth_connection_established` | Radar and Uplink linked to Earth |
| `storm_warning_revealed` | Storm day and rescue margin revealed |
| `research_beacon_unlocked` | Beacon visible in the Research Lab |
| `research_beacon_complete` | Beacon blueprint researched |
| `mission_sample_recovered` | Mars sample extracted and secured |
| `mission_beacon_deployed` | Beacon placed and operational |
| `event_rescue_requested` | Player passed final validation and pressed button |
| `event_ready_for_rescue` | Final readiness signal recorded |
| `event_storm_arrival` | Configured storm day reached |
| `event_evacuation_cutscene` | Successful ending cutscene started |
| `ending_alpha_rescued` | Successful ending completed |
| `ending_alpha_lost` | Storm/deadline failure ending completed |

Recommended state fields:

```text
isCommsEstablished: boolean
stormWarningRevealed: boolean
stormArrivalDay: number
rescueCutoffDay: number
beaconResearchUnlocked: boolean
beaconResearchComplete: boolean
beaconPlaced: boolean
sampleRecovered: boolean
rescueRequested: boolean
```

## 9. Required Implementation Changes

1. Add the opening intro and task-log presentation for the essentials.
2. Track completion of the essential module set independently of placement
   order.
3. Make research available as soon as the player places an operational
   Research Lab; do not gate it behind the essentials task.
4. Keep normal initial research player-directed rather than forcing a story
   sequence.
5. Require operational Radar and Uplink before setting
   `isCommsEstablished`.
6. Add the Earth connection notification and storm-warning event.
7. Hide the Beacon blueprint until the storm-warning event is received.
8. Add Beacon research completion and Build-menu availability.
9. Add the Sample Extractor and `Mars Sample` resource if not already present.
10. Add final rescue validation, including the configurable cutoff margin.
11. Add the `REQUEST RESCUE` interaction to the Uplink.
12. Add rescue-request, storm-arrival, evacuation, and failure state
    persistence.
13. Add the evacuation cutscene and successful ending.
14. Add HUD feedback for the active task, storm day, cutoff, sample, beacon,
    and missing rescue requirements.

## 10. Acceptance Checkpoints

| Checkpoint | Expected result |
|---|---|
| New game | Intro plays; first task log asks for essential modules |
| Essentials partially placed | Task remains incomplete; other actions remain available |
| All essentials placed | “Essential modules placed / System optimal” notification appears |
| Research Lab placed | Research is available immediately, independent of the essentials task |
| Only Radar or only Uplink active | Earth connection is not established |
| Radar and Uplink operational | Earth response plays and storm warning is revealed |
| Before Earth response | Beacon is absent from the Research Lab |
| After Earth response | Beacon blueprint is visible in the Research Lab |
| Beacon researched | Beacon becomes available in Build |
| Sample missing | Rescue request fails with a clear missing-sample message |
| Beacon missing | Rescue request fails with a clear missing-beacon message |
| After cutoff | Rescue request is rejected; storm failure remains possible |
| All requirements met before cutoff | Request succeeds and evacuation cutscene ends the game |
