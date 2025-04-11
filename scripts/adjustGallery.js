// adjustgallery.js - Using MutationObserver to avoid changing script.js

document.addEventListener('DOMContentLoaded', () => {

    console.log("adjustgallery.js (MutationObserver Version): DOMContentLoaded");

    // --- Configuration ---
    const GALLERY_GRID_SELECTOR = '.gallery-grid';
    const GALLERY_IMAGE_SELECTOR = '.gallery-image';
    const PAGE_SECTION_SELECTOR = '.page-section'; // Selector for switchable content sections
    const ACTIVE_CLASS_NAME = 'active';          // Class script.js adds to show a section
    const HEIGHT_REDUCTION_FACTOR = 0.5;
    const ROW_DETECTION_TOLERANCE = 10;
    const RESIZE_DEBOUNCE_DELAY = 250;
    const MUTATION_ADJUST_DELAY = 100; // Delay after detecting activation

    // --- Debounce utility ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout); timeout = setTimeout(later, wait);
        };
    }

    // --- Core height adjustment function (Same as before) ---
    function adjustGalleryImageHeights() {
        const galleryGrids = document.querySelectorAll(GALLERY_GRID_SELECTOR);
        const visibleGrids = Array.from(galleryGrids).filter(grid => !!(grid.offsetWidth || grid.offsetHeight || grid.getClientRects().length));

        if (visibleGrids.length === 0) { console.log("Adjust Heights: No visible gallery grids."); return; }
        console.log(`Adjust Heights: Adjusting for ${visibleGrids.length} visible grids...`);

        visibleGrids.forEach((grid, gridIndex) => {
            const images = Array.from(grid.querySelectorAll(GALLERY_IMAGE_SELECTOR));
            if (!images.length) { console.log(`Grid ${gridIndex}: No images.`); return; }
            console.log(`Grid ${gridIndex}: ${images.length} images. Resetting.`);
            images.forEach(img => { img.style.height = ''; }); // Reset

            const rows = [];
            images.forEach(img => { // Group by row
                const rect = img.getBoundingClientRect();
                if (rect.height === 0 || rect.width === 0) { return; }
                const top = Math.round(rect.top);
                let foundRow = rows.find(r => Math.abs(r.top - top) < ROW_DETECTION_TOLERANCE);
                if (foundRow) { foundRow.images.push(img); }
                else { rows.push({ top: top, images: [img] }); }
            });

            rows.sort((a, b) => a.top - b.top);
             console.log(`Grid ${gridIndex}: ${rows.length} rows detected.`);

            rows.forEach((row, rowIndex) => { // Calculate and apply
                let totalNaturalHeight = 0, validImageCount = 0;
                row.images.forEach(img => {
                    if (img.naturalHeight > 0) { totalNaturalHeight += img.naturalHeight; validImageCount++; }
                });
                if (validImageCount === 0) { console.log(`Grid ${gridIndex}, Row ${rowIndex}: No valid heights.`); return; }
                const averageNaturalHeight = totalNaturalHeight / validImageCount;
                const newHeight = averageNaturalHeight * HEIGHT_REDUCTION_FACTOR;
                console.log(`Grid ${gridIndex}, Row ${rowIndex}: Avg H=${averageNaturalHeight.toFixed(1)}, New H=${newHeight.toFixed(1)}.`);
                row.images.forEach(img => {
                    img.style.height = `${newHeight}px`;
                    img.style.objectFit = 'cover';
                });
            });
            console.log(`Grid ${gridIndex}: Adjustment complete.`);
        });
    }


    // --- Initial Load Trigger (Same as before) ---
     if (typeof imagesLoaded === 'function') {
        const gridsForLoadCheck = document.querySelectorAll(GALLERY_GRID_SELECTOR);
        if (gridsForLoadCheck.length > 0) {
             imagesLoaded( document.body, function(instance) {
                 console.log(`imagesLoaded: Ready. Initial height adjustment.`);
                 adjustGalleryImageHeights();
            }).on('fail', function() {
                console.error("imagesLoaded reported errors. Attempting adjustment anyway.");
                 adjustGalleryImageHeights();
            });
        }
    } else {
        console.warn("imagesLoaded lib missing. Using window.onload.");
        window.addEventListener('load', () => {
             console.log("Window loaded. Initial height adjustment.");
             adjustGalleryImageHeights();
         });
    }

    // --- Resize Trigger (Same as before) ---
    const debouncedAdjustHeights = debounce(adjustGalleryImageHeights, RESIZE_DEBOUNCE_DELAY);
    window.addEventListener('resize', debouncedAdjustHeights);


    // --- Navigation Trigger (Using MutationObserver) ---
    const sectionsToObserve = document.querySelectorAll(PAGE_SECTION_SELECTOR);

    if (typeof MutationObserver !== 'undefined' && sectionsToObserve.length > 0) {
        console.log(`Setting up MutationObserver to watch ${sectionsToObserve.length} page sections for class '${ACTIVE_CLASS_NAME}'.`);

        // Callback function when mutations are observed
        const observerCallback = function(mutationsList, observer) {
            for (const mutation of mutationsList) {
                // We only care about attribute changes, specifically the 'class' attribute
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const targetElement = mutation.target;

                    // Check if the target element now has the 'active' class AND contains a gallery
                    if (targetElement.classList.contains(ACTIVE_CLASS_NAME) && targetElement.querySelector(GALLERY_GRID_SELECTOR)) {
                        console.log(`MutationObserver detected section becoming active: #${targetElement.id}. Triggering height adjustment.`);
                        // Delay slightly to allow rendering after class change
                        setTimeout(adjustGalleryImageHeights, MUTATION_ADJUST_DELAY);
                        // NOTE: This might trigger adjustment on sections already adjusted if class toggles quickly.
                        // Add checks inside adjustGalleryImageHeights if needed, but visibility check should help.
                    }
                }
            }
        };

        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(observerCallback);

        // Configuration of the observer:
        const config = {
            attributes: true,       // Watch for attribute changes
            attributeFilter: ['class'], // Only watch the 'class' attribute
            childList: false,        // Don't watch child additions/removals
            subtree: false         // Don't watch descendants
        };

        // Start observing each page section
        sectionsToObserve.forEach(section => {
            observer.observe(section, config);
        });

        // Optional: Later, you could disconnect the observer if needed
        // observer.disconnect();

    } else if (sectionsToObserve.length === 0) {
         console.warn("MutationObserver: No page sections found to observe.");
    } else {
         console.error("MutationObserver is not supported in this browser.");
    }


}); // End DOMContentLoaded for adjustgallery.js