# Dell S3222DGM monitor reference

The owner knows the monitor is a black 32-inch curved Dell but not its model number. S3222DGM is the chosen visual reference, not a confirmed identification.

No usable free download of this exact model was found in the search. Free BlenderKit results were flat Dell monitors (generic modern Dell and S2421HN); other search results were different sizes or paid assets. This implementation is original procedural geometry, with no purchased model or third-party model dependency.

Sources:
- [Dell product specifications](https://www.dell.com/en-us/shop/dell-32-curved-gaming-monitor-s3222dgm/apd/210-azzr/monitors-monitor-accessories)
- [Dell dimensioned outline](https://dl.dell.com/manuals/all-products/esuprt_electronics_accessories/esuprt_electronics_accessories_monitor/dell-s3222dgm-monitor_Reference-Guide2_en-us.pdf)
- [Dell user guide, front and rear illustrations](https://dl.dell.com/manuals/all-products/esuprt_electronics_accessories/esuprt_electronics_accessories_monitor/dell-s3222dgm-monitor_Users-Guide_en-us.pdf)
- [Front, rear and angled product photographs](https://www.jamm21.com/products/dell-s3222dgm)

Dimensions used: 708.76 × 424.20 mm enclosure, original projected active area 692.94 × 392.26 mm, 1800 mm cylindrical radius, 455.98 mm overall height at the lowest stand position, approximately 237.61 mm base depth. Scene conversion is 2.25 units/mm, shared with the keyboard and desk mat.

`monitorLayout.ts` shares screen dimensions and positioning between the enclosure, live desktop, close camera and ScreenBar. The base rests on the shelf and the whole assembly follows the standing desk lift.

After the owner supplied IMG_1811.JPG, the visible bezel was revised to a continuous rounded ring with approximately 3 mm top/side borders and an 18 mm chin, following that photograph rather than claiming an exact model identification. The resulting live aperture is 702.76 × 403.20 mm. The personal sticker was removed.

The housing, bezel and desktop now share the cylindrical curve. There is one live iframe, not a set of duplicated strips. `CurvedDesktop.ts` computes a continuous SVG displacement map by intersecting camera rays with the 1800R cylinder. The map updates with the camera and standing desk. The browser surface is rasterized at 2× size and scaled into the scene for close-up sharpness. Pointer coordinates are mapped back to the live desktop; typing and form submission remain native.

Glass effects use matching curved geometry. The single curved aperture renders before the glass, and glass does not write depth, preventing the outer display from becoming obscured. Native hover effects, browser embeds and media remain in the single original document rather than being duplicated across strips. Input remapping applies to the same-origin desktop document; cross-origin embedded pages retain their own native event handling.

The panel shell follows the curve on both faces, with an approximately 12 mm perimeter and a gradual central electronics bulge. The edge thickness is a visual approximation from the owner’s photograph, not a verified measurement of their unidentified Dell model.

The angular base, rear ventilation, lower Dell wordmark and power indicator are modeled details. The larger silver wordmark uses actual Dell vector paths from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Dell_logo.svg), recolored with transparent padding.

Validation: `node scripts/preview-dell-monitor.mjs` uses the live desktop inside the new enclosure, measures model width and shelf contact, checks radius/sag, captures front and angled views checks the dock hover at close range, opens About Connor and types a terminal command through the continuously projected desktop. It expects a Vite server at localhost:5173. Outputs are in `output/dell-monitor-*.png`.
