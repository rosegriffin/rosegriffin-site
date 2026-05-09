
function applyRegionsAndColors(regions, probabilities) {
    for (const [region, counties] of Object.entries(regions)) {
        const p = probabilities[region] || 0;

        counties.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return; // ensure county id exists

            el.dataset.region = region;

            const color = `rgb(var(--heat-color))`;
            const tooltip = document.getElementById("map-tooltip");

            el.style.fill = color;
            el.style.fillOpacity = p + .05;

            // display probabilities on hover
            el.addEventListener("mousemove", (e) => {
                tooltip.style.opacity = "1";
                tooltip.textContent =`${region}: ${(p * 100).toFixed(1)}%`;
                tooltip.style.left = `${e.clientX + 12}px`;
                tooltip.style.top = `${e.clientY + 12}px`;
            });

            el.addEventListener("mouseleave", () => {
                tooltip.style.opacity = "0";
            });
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const REGION_FILE = "/static/data/adi-regions.json";
    const probabilities = {
        western: window.probabilities["Western  "],
        southern: window.probabilities["Southern  "],
        south_midland: window.probabilities["South Midland  "],
        north_midland: window.probabilities["North Midland  "],
        northern: window.probabilities["Northern  "],
        new_england: window.probabilities["New England  "],
        new_york_city: window.probabilities["New York City  "]
    };

    fetch(REGION_FILE)
    .then(res => res.json())
    .then(regions => {
        applyRegionsAndColors(regions, probabilities);
    })
    .catch(err => console.error(err));
});
