# Fire Alarm Battery Calculation Procedure

## Purpose

Battery calculations estimate the battery capacity required to support the fire alarm system during standby and alarm operation.

## Required Inputs

- Control panel model
- Power-supply model
- Charger rating
- Maximum permitted battery size
- Standby duration required by the project
- Alarm duration required by the project
- Standby current for every component
- Alarm current for every component
- Quantity of each component
- Auxiliary loads
- Annunciators
- Communicators
- Network modules
- Addressable modules
- Detectors
- Relays
- Notification appliances powered from the supply
- Voice amplifiers
- Expansion equipment
- Manufacturer derating or safety factor

## Basic Calculation Structure

Standby amp-hours:

Standby current × standby hours

Alarm amp-hours:

Alarm current × alarm hours

Subtotal:

Standby amp-hours + alarm amp-hours

Adjusted capacity:

Subtotal × required safety or aging factor

## Required Verification

Verify:

- Exact current values from the current manufacturer documentation
- Whether the current is standby, alarm, supervisory, or maximum
- Charger compatibility
- Battery enclosure capacity
- Battery type
- Required standby duration
- Required alarm duration
- Project specifications
- Adopted code
- AHJ amendments

## Engineering Rule

Do not reuse battery current values from another panel revision, firmware generation, board configuration, or project.

Do not use rounded device counts when exact quantities are available.

## Required Output

Record:

- Panel designation
- Power-supply designation
- Standby current
- Alarm current
- Standby duration
- Alarm duration
- Raw amp-hour requirement
- Applied safety factor
- Final amp-hour requirement
- Selected battery size
- Charger compatibility
- Calculation date
- Drawing revision
- Manual revision
