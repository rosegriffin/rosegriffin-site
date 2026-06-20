
function getValues(dict) {
    return Object.keys(dict).map(function(key){ return dict[key]; });
}

function applyRegionsAndColors(regions, probabilities) {

    const maxOpacity = 1;
    const minOpacity = 0.05;
    const maxProb = Math.max(...getValues(probabilities));
    const minProb = 0;
    const color = `rgb(var(--heat-color))`;

    const allZero = maxProb === 0;

    for (const [region, counties] of Object.entries(regions)) {

        // determine opacity
        const p = probabilities[region] || 0;

        // rescale probability into opacity
        const opacity = allZero
            ? minOpacity
            : minOpacity + (p - minProb) * (maxOpacity - minOpacity) / (maxProb - minProb);

        counties.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return; // ensure county id exists

            el.dataset.region = region;
            const tooltip = document.getElementById("map-tooltip");

            el.style.fill = color;
            el.style.fillOpacity = opacity;

            // tooltip display probabilities on hover
            el.addEventListener("mousemove", (e) => {
                tooltip.style.opacity = "1";
                tooltip.textContent =`${region}: ${(p * 100).toFixed(1)}%`;

                // default to bottom right
                tooltip.style.left = `${e.clientX + 12}px`;
                tooltip.style.top = `${e.clientY + 12}px`;

                // check if overflowing
                const rect = tooltip.getBoundingClientRect();

                if (rect.right > window.innerWidth) {
                    tooltip.style.left = `${e.clientX - rect.width - 12}px`;
                }
            });

            el.addEventListener("mouseleave", () => {
                tooltip.style.opacity = "0";
            });
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const REGION_FILE = "/static/data/adi-regions.json";

    fetch(REGION_FILE)
    .then(res => res.json())
    .then(regions => {

        const p = window.probabilities ?? {};

        const probabilities = {
            western: p["Western  "] || 0,
            southern: p["Southern  "] || 0,
            south_midland: p["South Midland  "] || 0,
            north_midland: p["North Midland  "] || 0,
            northern: p["Northern  "] || 0,
            new_england: p["New England  "] || 0,
            new_york_city: p["New York City  "] || 0
        };

        applyRegionsAndColors(regions, probabilities);
    })
    .catch(err => console.error(err));
});
