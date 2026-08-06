# Distributed-Load Voltage-Drop Calculation

## Purpose

A distributed-load calculation determines voltage at each appliance or circuit segment rather than applying the full circuit current across the entire conductor length.

## Required Inputs

- Power-supply model
- Circuit terminal
- Starting voltage
- Minimum available terminal voltage
- Appliance model
- Appliance setting
- Alarm current for each appliance
- Distance between each appliance
- Conductor material
- Conductor gauge
- Minimum appliance operating voltage
- Manufacturer calculation requirements

## Segment Method

For each segment:

1. Determine the downstream current.
2. Determine the segment conductor resistance.
3. Calculate segment voltage drop.
4. Subtract the segment drop from the incoming voltage.
5. Use the resulting voltage as the starting voltage for the next segment.
6. Continue to the last appliance.

## Segment Formula

Segment resistance:

R = 2 × segment length × conductor resistance per foot

Segment voltage drop:

Vdrop = downstream current × segment resistance

Next-segment voltage:

Vnext = Vincoming - Vdrop

## Required Review

Confirm:

- Every appliance is in the correct sequence
- Every segment length is recorded
- Each appliance current matches its selected setting
- Wire gauge is correct
- The final appliance voltage exceeds its minimum listed operating voltage
- Circuit load does not exceed the source rating
- Synchronization and compatibility are verified

## Engineering Rule

Use the manufacturer's required calculation method when it differs from this preliminary segment method.
