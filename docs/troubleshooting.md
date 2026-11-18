# Troubleshooting

## The report says the file is not valid

GeoJSON Atlas reads JSON with a top-level type of FeatureCollection, Feature or a geometry type. Other JSON is reported as not GeoJSON. Coordinates are always read as longitude, latitude in WGS 84, as RFC 7946 requires; a crs member is reported because RFC 7946 removed it.

## The file is too large

Reports read files up to the size set in `geojsonAtlas.maxFileSizeMB` (50 MB by default and at most). VS Code passes files only up to 50 MB to extensions, so a larger file cannot be read by any extension: split it, or save a shorter one.

## The preview does not open

The report always opens as a Markdown document. If the preview stays closed, set `geojsonAtlas.openReportsAsPreview` to true and check that the built-in Markdown extension is enabled.

## Pro or the trial does not unlock

Run **GeoJSON Atlas: Show Licence Status**. It tells whether a key is stored, whether it was checked, and how many trial days are left. Details are in [licence.md](licence.md).

## Something else

Run **GeoJSON Atlas: Report A Problem**. It copies a diagnostics block (versions, settings, licence state; no file contents) and opens the issues page.
