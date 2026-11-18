# Reports

Every report reads the text of the active editor and opens its result as a new Markdown document. Your file is never changed and nothing is sent anywhere. The examples below come from the sample file (Open Sample File).

## Show GeoJSON Summary

Command: **GeoJSON Atlas: Show GeoJSON Summary**

Shows the top-level type, the number of features, how many have an id and how many have no geometry, the bounding box of all valid positions (west, south, east, north) and the number of features per geometry type.

Example (sample file):

> # GeoJSON Summary
>
> FeatureCollection with 6 features (3 with an id, 1 without geometry).
>
> Bounding box: 13.3, 13.3501, 52.5145, 52.53 (west, south, east, north).
>
> | Geometry type | Features |
> | --- | ---: |
> | Point | 2 |
> | LineString | 2 |
> | Polygon | 1 |

## Show Validation

Command: **GeoJSON Atlas: Show Validation**

Checks the structure against RFC 7946: feature and geometry members, positions of 2 or 3 numbers, longitudes from -180 to 180 and latitudes from -90 to 90 (with a hint when they look swapped), lines with at least 2 positions, rings with at least 4 positions that end where they start, and the removed crs member. Every problem is listed with its location such as features[3].geometry.coordinates[0].

Example (sample file):

> # GeoJSON Validation
>
> No problems found.

## Show Properties

Command: **GeoJSON Atlas: Show Properties**

Lists every property key used by the features, how many features have it and how many lack it, and the types of its values (string, number, boolean, null, array, object), the most common keys first.

Example (sample file):

> # Properties
>
> 3 properties across 6 features.
>
> | Property | Features | Missing | Types |
> | --- | ---: | ---: | --- |
> | name | 6 | 0 | string |
> | capacity | 3 | 3 | null, number |
> | open | 2 | 4 | boolean |

## Show Geometry Quality (Pro)

Command: **GeoJSON Atlas: Show Geometry Quality** (Pro; part of the 14-day trial)

Finds features without geometry, empty geometries, exterior rings that are clockwise and holes that are counterclockwise (RFC 7946 asks for the opposite), repeated consecutive positions, coordinates with more than 7 decimals and bbox members that do not contain all positions.

Example (sample file):

> # Geometry Quality
>
> 5 findings.
>
> | Location | Check | Finding |
> | --- | --- | --- |
> | features\[1\].geometry.coordinates\[2\] | duplicate_point | the same position as the one before it |
> | features\[2\].geometry.coordinates\[0\] | orientation | the exterior ring is clockwise; RFC 7946 asks for counterclockwise |
> | features\[4\] | null_geometry | the feature has no geometry |
> | features\[5\].geometry.coordinates\[0\] | precision | more than 7 decimals \(finer than 1 cm\); the file is larger than it needs to be |
> | features\[5\].geometry.coordinates\[1\] | precision | more than 7 decimals \(finer than 1 cm\); the file is larger than it needs to be |

## Show Measurements (Pro)

Command: **GeoJSON Atlas: Show Measurements** (Pro; part of the 14-day trial)

Measures every line (length) and polygon (area without its holes, and the length of its outer ring) on a sphere with the mean Earth radius, names each feature by its name, title, label or id, and gives the totals.

Example (sample file):

> # Measurements
>
> Lengths and areas on a sphere of radius 6371.0088 km (the mean Earth radius); polygon lengths are the length of the outer ring.
>
> | Feature | Geometry | Length (km) | Area (km²) |
> | --- | --- | ---: | ---: |
> | Route 7 | LineString | 3.357 | - |
> | Delivery Zone A | Polygon | 14.792 | 13.544 |
> | Survey line | LineString | 1.361 | - |
>
> Total: 19.510 km, 13.544 km².
