# Project Tharsis: Outpost Alpha Mission Plan

## 1. Mission Brief

The player is the lone engineer assigned to Outpost Alpha, one of three
independent Martian research outposts. Alpha was designed to collect geological
samples and transmit them to Earth, but a planet-wide Solar Particle Event on
Sol 10 destroyed primary communications and damaged the atmosphere.

On Sol 15, after the Communication Radar Array is realigned, Earth confirms
that a terminal radiation wave will reach Alpha on Sol 29. Outpost Beta,
protected inside a volcanic lava tube 1,200 km away, dispatches an automated
pressurized rover. The rover is already travelling toward Alpha and can
complete the evacuation before Sol 30 once the final rescue signal is sent.

The engineer must:

1. Keep the habitat and life-support chain operational.
2. Mine and refine enough material to expand the base.
3. Research and construct radiation protection.
4. Recover a Martian sample using the late-game Sample Extractor.
5. Establish the Radar + Mission Control Uplink communications chain.
6. Deploy the final beacon and tell Earth that the sample is ready.
7. Deploy the beacon and send the rescue signal around Sol 25-26.
8. Trigger the rover evacuation cutscene before Sol 30.

The primary failure condition is missing the final readiness transmission before
the Sol 29 radiation event.

## 2. Player-Facing Victory Condition

The player wins only when all of the following are true:

- The Mars sample has been extracted and secured.
- The Rad-Shield Tower is built and operational.
- The Comms Radar is built, repaired, and active.
- The Mission Control Uplink is built, repaired, and active.
- The final beacon has been deployed through the communication chain.
- The player has sent the `READY_FOR_RESCUE` transmission.
- The player has clicked the final `REQUEST_RESCUE` interaction.
- The rover evacuation cutscene has completed before Sol 30.

The final sequence is:

1. The uplink locks onto Earth.
2. Earth confirms receipt of the Mars sample telemetry.
3. The engineer receives the rover's final approach signal.
4. The player clicks **REQUEST RESCUE**.
5. A cutscene shows the rover arriving at Alpha and evacuating the engineer.
6. The engineer loads the Mars sample and the rover begins the return journey.
7. The game ends with the successful rescue ending; Sol 30 is not played as
   an additional gameplay day.

## 3. Initial State: Sol 1

### 3.1 Story opening cutscene

> **OUTPOST ALPHA // SOL 01 // LANDING COMPLETE**
>
> The landing capsule settles into the red dust. Alpha is intact, and the
> engineer has already assembled the Habitat before the game begins. The
> shelter is pressurized, but almost everything else must be built.
>
> The mission clock begins. Build enough infrastructure to survive, then
> recover a sample worthy of bringing home.

### 3.2 Current starting inventory

These are the current quantities defined by the game state:

| Item | Starting quantity | Initial use |
|---|---:|---|
| Iron Ore | 15 | Iron Plates and Electronics |
| Silicates | 15 | Glass Panels and Electronics |
| Iron Plate | 35 | Initial construction |
| Glass Panel | 20 | Habitat, greenhouse, solar, and uplink construction |
| Electronics | 20 | Power, production, research, and communications |
| Repair Kit | 2 | Emergency module repairs |
| Water Filter | 0 | Workshop craft; reserve for future filter systems |
| Air Filter | 0 | Workshop craft; reserve for future filter systems |
| Water | 10 | Life support, hydration, and greenhouse food production |
| Raw Food | 5 | Kitchen recipes |
| Soup | 1 | Initial fatigue recovery |
| Meal | 0 | Unlocked by Food: Meal Preparation |
| Good Meal | 0 | Unlocked by Food: Nutritional Optimization |
| Mars Sample | 0 | New late-game objective item |

`Mars Sample` is a planned resource and must be added to the inventory model.
It should not be available from the starting inventory or ordinary crafting.

### 3.3 Initial placed modules

The game starts with one prebuilt and fully repaired Habitat. The Habitat's
construction cost is not deducted from the starting inventory. It is the
engineer's completed shelter from the intro cutscene.

Recommended first placement order:

1. Solar Array
2. Battery
3. Water Extractor
4. Regolith Extractor
5. Workshop
6. Kitchen
7. Greenhouse
8. Research Lab

The Habitat should start with 100/100 HP, be active, and be represented in
`placedModules` before the first game tick. The player should not be forced to
build every recommended module on a single day. The order is a priority guide
that protects survival before expansion.

## 4. Module Priority and Resource Plan

### 4.1 Survival priority

| Priority | Module | Why it matters | Current build cost |
|---:|---|---|---|
| 1 | Solar Array | Generates 25 power during daylight | 2 Iron Plate, 4 Glass Panel, 2 Electronics |
| 2 | Battery | Stores power for night operations | 6 Iron Plate, 6 Electronics |
| 3 | Water Extractor | Produces 2 Water per production tick | 5 Iron Plate, 2 Electronics |
| 4 | Regolith Extractor | Produces 3 Iron Ore and 2 Silicates per tick | 6 Iron Plate, 3 Electronics |
| 5 | Workshop | Converts raw materials into construction supplies | 10 Iron Plate, 5 Electronics |
| 6 | Kitchen | Converts Raw Food into fatigue recovery meals | 6 Iron Plate, 2 Glass Panel, 2 Electronics |
| 7 | Greenhouse | Produces food packs using Water | 4 Iron Plate, 8 Glass Panel |
| 8 | Research Lab | Unlocks technology and mission-critical blueprints | 6 Iron Plate, 6 Glass Panel, 8 Electronics |

### 4.2 Expansion priority

After the survival chain is online, build toward:

1. A second Solar Array before increasing heavy power consumption.
2. A second Battery if night-time power deficits occur.
3. A second Regolith Extractor for construction and research throughput.
4. Small Storage Depots when inventory capacity becomes a bottleneck.
5. A second Water Extractor only if greenhouse and life-support demand require it.
6. The Rad-Shield Tower before Sol 25.
7. The Comms Radar and Mission Control Uplink before the final beacon event.
8. The beacon and final rescue interaction on Sol 25 or Sol 26.

The player should reserve Electronics for the radar, uplink, tower, and repairs.
Do not spend all Electronics on optional production queues before Sol 15.

## 5. Research and Unlock Sequence

The research queue has two slots. Research costs Silicates and consumes lab time.
The following is the recommended sequence, not a requirement that every node be
completed in the exact order:

| Order | Research node | Cost | Time | Unlock | Recommended window |
|---:|---|---:|---:|---|---|
| 1 | Meal Preparation | 3 Silicates | 1 hour | Meal recipe | Sol 3-6 |
| 2 | Nutritional Optimization | 6 Silicates | 2 hours | Good Meal recipe | Sol 6-10 |
| 3 | Rad-Shield Tower | 15 Silicates | 4 hours | Rad-Shield Tower blueprint | Sol 11-17 |
| 4 | Comms Radar | 10 Silicates | 3 hours | Comms Radar blueprint | Sol 12-15 |
| 5 | Mission Control Uplink | 12 Silicates | 3 hours | Communication blueprint | Sol 16-21 |
| 6 | Automated Logistics | 8 Silicates | 3 hours | Large Storage blueprint | Sol 18-23 |
| 7 | Sample Recovery Protocol | 20 Silicates | 6 hours | Sample Extractor blueprint | Sol 18-24 |

`Sample Recovery Protocol` is a planned research node. It should be added to
the research tree and should unlock the `sample_extractor` module.

The Sample Extractor should cost approximately:

- 18 Iron Plate
- 10 Electronics
- 6 Glass Panel

It should have 100 maximum integrity, consume approximately 25 power, and
require an 8-hour extraction job. These are balancing recommendations and
should be tuned after a complete Sol 1-30 playtest.

## 6. Communication and Rescue Logic

### 6.1 Early distress transmission: Sol 15

The early communication is a progress checkpoint, not the victory condition.
It requires:

- Comms Radar placed and active.
- Mission Control Uplink placed and active.
- Sufficient power for both modules.
- Radar alignment interaction completed.

Transmission text:

> **EARTH UPLINK ESTABLISHED**
>
> Alpha has survived the communications blackout. We have confirmed a
> terminal radiation wave on Sol 29. Beta acknowledges the emergency and
> dispatches a pressurized rescue rover. Estimated arrival: Sol 30.

This event sets `isCommsEstablished` and unlocks the rescue countdown.

### 6.2 Final readiness transmission and rescue request: Sol 25-26

The final transmission requires:

- Sample Extractor completed.
- `Mars Sample` stored in the inventory.
- Rad-Shield Tower placed and active.
- Comms Radar placed and active.
- Mission Control Uplink placed and active.
- Final beacon deployed.
- All critical modules have enough HP to remain operational until rescue.

The beacon is the final deployment state of the Radar + Mission Control Uplink
chain. It should be represented as a separate interaction/state so the player
must actively prepare the communication system, without requiring a third
large permanent module.

Transmission text:

> **EARTH // FINAL EXTRACTION REQUEST**
>
> Mars sample secured. Beacon deployed. Outpost Alpha requests immediate
> extraction at the Sol 30 rescue coordinate. Confirm rover approach.

The player clicks `REQUEST RESCUE` after the beacon is deployed. The click
records the final signal and immediately starts the rover-arrival cutscene.
If the player has not clicked it by the start of Sol 29, trigger the hard-fail
ending.

## 7. Sol-by-Sol Mission Progression

### Phase 0: Landing and stabilization — Sol 1-3

#### Mission M01: Establish a survivable shelter

- **Window:** Sol 1-2
- **Objective:** Activate the prebuilt Habitat, then place the Solar Array,
  Battery, and Water Extractor.
- **Success condition:** Habitat is active, Water production has begun, and
  the base has enough power to operate through one night.
- **Reward:** Unlocks the normal build loop; the Habitat construction step is
  already complete.
- **Failure pressure:** Without water and power, later food and life-support
  tasks cannot be sustained.

#### Mission M02: Open the regolith supply chain

- **Window:** Sol 2-3
- **Objective:** Place the Regolith Extractor and collect Iron Ore and Silicates.
- **Success condition:** At least 12 additional Iron Ore and 8 additional
  Silicates have been produced.
- **Recommended action:** Keep one Repair Kit unused for an emergency.

### Phase 1: Build the industrial base — Sol 3-9

#### Mission M03: Restore fabrication

- **Window:** Sol 3-6
- **Objective:** Place the Workshop and craft Iron Plates, Glass Panels, and
  Electronics.
- **Success condition:** Workshop operational and at least 8 Electronics
  available after construction.
- **Priority:** Craft construction materials before optional Repair Kits.

#### Mission M04: Protect the engineer's shift cycle

- **Window:** Sol 4-8
- **Objective:** Place Kitchen and Greenhouse; craft Soup and research Meal
  Preparation.
- **Success condition:** Maintain at least two prepared food items and avoid
  exhausting all Raw Food.
- **Recommended rationing:** Use Soup for ordinary fatigue and reserve Good
  Meals for extended work or emergency recovery.

#### Mission M05: Start the technology program

- **Window:** Sol 6-9
- **Objective:** Place the Research Lab and research Meal Preparation followed
  by Nutritional Optimization.
- **Success condition:** At least one advanced meal recipe is unlocked and the
  lab can operate without disabling life support.

### Phase 2: Discover the threat — Sol 10-15

#### Cutscene C02: The Solar Particle Event — Sol 10

> The sky turns white-red. Instruments saturate. The primary communications
> mast tears itself apart under the particle load. Atmospheric readings fall
> outside every survival model.
>
> Alpha is alive, but Earth can no longer hear the outpost.

Gameplay consequences:

- Radiation damage continues according to the normal decay model.
- The player must preserve Electronics and Repair Kits.
- Production may be paused to protect power and inventory.

#### Mission M06: Survive the blackout

- **Window:** Sol 10-14
- **Objective:** Keep Habitat, life support, water, and power operational while
  preparing the research and communications chain.
- **Success condition:** No critical module reaches zero HP and the Research Lab
  remains usable.

#### Mission M07: Re-align the sky

- **Window:** Sol 12-15
- **Objective:** Research and construct the Comms Radar, then complete its
  alignment interaction.
- **Success condition:** Radar active and alignment complete on or before Sol 15.
- **Reward:** Enables the Earth distress transmission and reveals the Sol 29
  radiation deadline.

#### Cutscene C03: Earth Answers — Sol 15

> The radar dish locks onto a weak carrier wave. Earth answers in fragments.
> The message contains one clear number: **29**.
>
> Beta has survived underground. Their rover can reach Alpha on Sol 30.
> There is no second rescue window.

### Phase 3: Prepare for radiation — Sol 16-23

#### Mission M08: Build the shield

- **Window:** Sol 16-21
- **Objective:** Research and construct the Rad-Shield Tower.
- **Success condition:** Tower is placed within coverage range of the critical
  base modules and remains active.
- **Priority:** Place it so the Habitat, Research Lab, Radar, and Uplink are
  inside its radius.
- **Failure pressure:** A tower built too late may not protect the base before
  the next radiation wave.

#### Mission M09: Establish the uplink chain

- **Window:** Sol 16-22
- **Objective:** Research and construct the Mission Control Uplink.
- **Success condition:** Radar and Uplink are both active and have sufficient
  power reserves.
- **Recommended reserve:** Keep at least 8 Electronics and 6 Iron Plates for
  emergency repairs after construction.

#### Mission M10: Expand logistics

- **Window:** Sol 18-23
- **Objective:** Research Automated Logistics and build at least one Large
  Storage Depot if inventory limits are reached.
- **Success condition:** Required tower, uplink, sample-extractor, and repair
  materials can be stored without blocking production.
- **Optional:** Build a second Battery or Regolith Extractor if power or
  material throughput is insufficient.

### Phase 4: Recover the sample — Sol 18-25

#### Mission M11: Recover the Martian sample

- **Window:** Sol 20-25
- **Objective:** Research Sample Recovery Protocol, build the Sample Extractor,
  and complete one extraction operation.
- **Success condition:** `Mars Sample >= 1`.
- **Extraction rules:**
  - Sample Extractor must be active and powered.
  - Extraction takes 8 active hours.
  - Progress pauses when the module is inactive or without power.
  - The sample is awarded only when the extraction job completes.
  - The sample cannot be consumed by ordinary recipes.

#### Mission M12: Stabilize for the final wave

- **Window:** Sol 23-28
- **Objective:** Repair and maintain the tower, radar, uplink, habitat, and
  power infrastructure.
- **Success condition:** All critical modules are active, powered, and above
  the final-event safety threshold.
- **Recommended stockpile by Sol 28:**
  - 18 Iron Plate
  - 10 Electronics
  - 2 Repair Kits
  - 6 Water
  - 2 prepared meals
  - Enough stored power for one full night cycle

### Phase 5: Final transmission and rescue — Sol 25-26

#### Mission M13: Deploy the beacon and request rescue

- **Window:** Sol 25-26
- **Objective:** Use the active Radar + Mission Control Uplink chain to deploy
  the final beacon, send the readiness signal, and click `REQUEST RESCUE`.
- **Success condition:** Beacon deployment state is active, the Mars Sample is
  secured, and the rescue interaction is accepted.
- **Interaction rules:**
  - The button is disabled until all rescue requirements are satisfied.
  - Clicking the button records `READY_FOR_RESCUE` and immediately starts the
    rover-arrival cutscene.
  - The player cannot cancel the request after clicking it.
  - The mission ends after the evacuation cutscene; no additional Sol 27-30
    gameplay is required.

#### Cutscene C04: Rover arrival and evacuation — Sol 25-26

> The beacon changes frequency. Earth confirms the sample manifest and Beta
> answers with a final approach vector.
>
> Through the dust, the heavy pressurized rover reaches Alpha. The engineer
> seals the sample container, uploads the mission logs, and climbs aboard.
> Outpost Alpha disappears behind the rover as it begins the journey home.

Victory requirements when `REQUEST RESCUE` is clicked:

- `Mars Sample >= 1`
- Rad-Shield Tower is built and active.
- Comms Radar is built and active.
- Mission Control Uplink is built and active.
- Final beacon is deployed.
- `READY_FOR_RESCUE` is recorded.
- Current Sol is 25 or 26.

#### Mission M14: Survive if rescue was delayed

- **Window:** Sol 27-28
- **Objective:** Continue maintaining the base if the player has not yet
  requested rescue.
- **Success condition:** Reach the rescue interaction with all requirements
  intact.
- **Failure pressure:** The terminal radiation event occurs on Sol 29. The
  player must request rescue before then.

#### Cutscene C05: The Terminal Wave — Sol 29

> The horizon disappears behind a wall of charged dust. The Rad-Shield Tower
> bends the worst of the wave away from the habitat, but every alarm in Alpha
> begins to sound.
>
> The beacon continues transmitting, but the rescue window has already closed.
> Alpha's systems fall silent beneath the terminal wave.

Gameplay rules:

- The wave applies the configured radiation damage.
- The tower reduces damage within its coverage radius.
- Critical module destruction causes mission failure.
- If `REQUEST RESCUE` was not clicked before Sol 29, show the hard-fail ending.

#### Cutscene C06: Return to Earth

> The rover's navigation system clears the dust front and locks onto the
> return corridor. The Mars sample is safe, the Alpha logs are transmitted,
> and the engineer is finally on the way back to Earth.

The successful game ending occurs immediately after the evacuation sequence.
Sol 30 remains part of the story's original rescue estimate, but it is no
longer a playable deadline or required end-state.

## 8. Radiation and Module Integrity Management

### 8.1 Current integrity values

All current modules have `maxIntegrity: 100`. Their `baseDecayRate` values are:

| Module | Base decay rate | Management priority |
|---|---:|---|
| Habitat | 4 | Critical |
| Greenhouse | 5 | High |
| Kitchen | 3 | Medium |
| Life Support | 4 | Critical |
| Water Extractor | 4 | High |
| Regolith Extractor | 6 | High |
| Workshop | 3 | Medium |
| Solar Array | 4 | High |
| Battery | 2 | Critical for night power |
| Research Lab | 3 | High until all required research is complete |
| Rad-Shield Tower | 8 | Critical after construction |
| Comms Radar | 5 | Critical from Sol 15 onward |
| Mission Control Uplink | 4 | Critical from Sol 16 onward |
| Small Storage Depot | 2 | Low |
| Large Storage Depot | 3 | Medium |
| Sample Extractor | 6 recommended | Critical during extraction |

### 8.2 Current radiation formula and event schedule

The current game constants are:

- Day decay: `5%` per Sol constant.
- Night decay: `7.5%` per Sol constant.
- Radiation wave damage: `7.5%` of maximum integrity.
- Radiation wave interval: every `3` Sols.
- Tower reduction: `65%` during both day and night.
- Tower coverage radius: `4` grid units.

There are two different radiation systems:

1. **Continuous integrity decay:** applied during every hourly time advance,
   using the day/night rates above.
2. **Periodic radiation waves:** currently scheduled every three Sols. With
   `currentDay = 1` and `lastRadiationWaveDay = 1`, the current implementation
   produces wave events on approximately:

   `Sol 4, Sol 7, Sol 10, Sol 13, Sol 16, Sol 19, Sol 22, Sol 25, and Sol 28`.

The story's major Solar Particle Event is the scripted **Sol 10** event. The
terminal story event is the scripted **Sol 29** radiation event. The periodic
Sol 28 wave is the last normal wave before the terminal event. If the design
requires the terminal event itself to be the only wave on Sol 29, the
implementation should explicitly schedule or rename the Sol 29 event rather
than relying only on the periodic three-Sol calculation.

The hourly update applies the day/night rates proportionally. Because the game
uses separate day and night hours, the observed integrity loss per Sol is
approximately:

```text
(daylight hours / 24 * 5%)
+ (night hours / 24 * 7.5%)
+ radiation wave damage when a wave is due
```

The exact result depends on the hour at which the Sol begins and whether a
module is inside the tower radius. The mission plan should treat the constants
above as the source of truth rather than promising a fixed HP loss per Sol.

### 8.3 Repair policy

Repair Kits are consumed when a repair begins. Current repair durations are:

| Module HP percentage | Repair duration |
|---:|---:|
| 80% or higher | 1 hour |
| 16%-50% | 2 hours |
| Below 16% | 4 hours |

Recommended policy:

1. Repair Habitat, Life Support, Radar, Uplink, and Tower first.
2. Repair power generation and Battery before optional production.
3. Pause non-critical production during emergency repairs.
4. Keep two Repair Kits reserved for Sol 28-29 unless the base is otherwise
   unable to operate.

## 9. Mission State and Event IDs

The implementation should expose stable IDs so saves, UI, and cutscenes can
refer to the same progression:

| ID | Meaning |
|---|---|
| `story_landing_complete` | Opening cutscene completed |
| `mission_survival_chain` | Habitat, power, and water operational |
| `mission_regolith_chain` | Mining and refining operational |
| `event_solar_particle_event` | Sol 10 blackout event |
| `mission_radar_alignment` | Radar aligned on or before Sol 15 |
| `event_earth_distress_response` | Earth/Beta rescue response received |
| `mission_radiation_shield` | Rad-Shield Tower built and active |
| `mission_uplink_ready` | Radar and Mission Control Uplink active |
| `research_sample_recovery` | Sample Recovery Protocol completed |
| `mission_sample_recovered` | Mars sample extracted |
| `mission_beacon_deployed` | Final beacon deployed |
| `event_ready_for_rescue` | Final readiness transmission sent |
| `event_terminal_radiation` | Sol 29 radiation event |
| `event_rover_arrival` | Sol 25-26 rescue cutscene after `REQUEST_RESCUE` |
| `ending_alpha_rescued` | Victory ending completed |
| `ending_alpha_lost` | Hard-fail ending completed |

## 10. Required Content and Code Additions

This document describes the intended mission design. The current codebase does
not yet contain every required gameplay object. The following additions are
required to implement the complete plan:

1. Add `mars_sample` to `ResourceType`, inventory initialization, icons, and
   storage handling.
2. Add the `sample_extractor` module definition and texture.
3. Add the `research_sample_recovery` research node.
4. Add an extraction queue/job with active-time-only progress.
5. Add mission state, event IDs, and save-state persistence.
6. Add radar alignment and beacon deployment interactions.
7. Require both Radar and Mission Control Uplink for the final transmission.
8. Add Sol 10, Sol 15, Sol 25-26, and Sol 29 cutscenes.
9. Add the hard-fail ending when readiness is missing before Sol 29.
10. Add the victory ending immediately when the rover arrives on Sol 25-26
    with the sample.
11. Add mission HUD indicators for the next objective, deadline, sample state,
    beacon state, and rescue readiness.
12. Add a complete Sol 1-30 playtest using the inventory and build priorities
    in this document.

## 11. Recommended Playtest Checkpoints

| Checkpoint | Expected state |
|---|---|
| Start of Sol 1 | Habitat already built; initial inventory available |
| End of Sol 3 | Solar, Battery, Water, and Drill operational |
| End of Sol 9 | Workshop, Kitchen, Greenhouse, and Research Lab operational |
| End of Sol 15 | Radar aligned; Earth distress response received |
| End of Sol 21 | Rad-Shield Tower and Mission Control Uplink built |
| End of Sol 25 | Mars Sample secured; beacon ready or deployed |
| Sol 25-26 | Beacon deployed, `REQUEST RESCUE` clicked, evacuation ending plays |
| End of Sol 28 | Only relevant if rescue was delayed; base remains operational |
| Sol 29 | Hard-fail radiation event if rescue was not requested |

If a normal player cannot reach the Sol 28 checkpoint while prioritizing
survival, reduce research costs or increase early material throughput before
reducing the hard deadline.
