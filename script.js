$(document).ready(function () {

    // Documentation show/hide handler
    // ref: https://api.jquery.com/slideToggle/
    const docs = document.getElementById("docs-container");
    $(docs).hide(); // keep docs hidden at page load
    $("#docs-toggle").click(() => {
        if ($(docs).is(":visible")) {
            $(docs).slideUp(200);
            $("#docs-toggle-text").text("Vis dokumentasjon");
        } else {
            $(docs).show();
            docs.scrollIntoView({ behavior: 'smooth' });
            $("#docs-toggle-text").text("Skjul dokumentasjon");
        }
    });

    // SVG interaction handlers
    const bgTriangles = $("#bg-triangles");
    const fgTriangles = $("#fg-triangles");
    const centerDisc = $("#center-disc");
    const svgLabel = $("#svg-label");
    bgTriangles.click(() => bgTriangles.toggleClass("rotated"));
    fgTriangles.click(() => fgTriangles.toggleClass("rotated-reverse"));
    centerDisc.click(() => {
        svgLabel.toggleClass("visible");
        centerDisc.toggleClass("grown");
        bgTriangles.toggleClass("rotated");
        fgTriangles.toggleClass("rotated-reverse");
    });

})
