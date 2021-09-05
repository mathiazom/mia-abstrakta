// Achieve higher render resolution by increasing the internal dimensions
const SCALE = 5;
const CANVAS_WIDTH = 300 * SCALE;
const CANVAS_HEIGHT = 300 * SCALE;

// Imperfect imitation of the CSS animation 'ease-in-out' (bezier curve)
// https://en.wikipedia.org/wiki/B%C3%A9zier_curve#Cubic_B%C3%A9zier_curves
// https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function
const easeInOut = (t) => 3 * (1 - t) * t ** 2 + t ** 3;

// Enum-like definition of the available radius animations
const RadiusAnimation = Object.freeze({
    Grow: 0,
    Shrink: 1
});

const DISC_RADIUS_INITIAL = 30 * SCALE;
const DISC_RADIUS_GROWN = 4 * DISC_RADIUS_INITIAL;
// Hue of the HSL color space (simpler to animate between than RGB values)
const DISC_HUE_INITIAL = 14; // orange-ish
const DISC_HUE_GROWN = 0; // red
const CENTER_DISC_ANIMATION_DURATION = 1000;
const centerDisc = {
    radius: DISC_RADIUS_INITIAL,
    grown: false,
    animationDuration: CENTER_DISC_ANIMATION_DURATION
};

// Enum-like definition of the available rotations
const Rotation = Object.freeze({
    Clockwise: 0,
    CounterClockwise: 1
})

const TRIANGLE_ROUNDING = 18 * SCALE;
const TRIANGLE_PADDING_FACTOR = 0.8;
const TRIANGLE_SIDE = 104.5 * SCALE - TRIANGLE_ROUNDING * TRIANGLE_PADDING_FACTOR * 0.9;
const TRIANGLE_ANIMATION_DURATION = 2000;
const fgTriangleCircle = {
    fill: "#0288d1",
    state: Rotation.Clockwise,
    rotationOffset: Math.PI / 4,
    rotation: this.rotationOffset,
    animationDuration: TRIANGLE_ANIMATION_DURATION
};
const bgTriangleCircle = {
    fill: "#01579b",
    rotation: 0,
    animationDuration: TRIANGLE_ANIMATION_DURATION
};

// Enum-like definition of the available opacity animations
const OpacityAnimation = Object.freeze({
    Show: 0,
    Hide: 1
});

const LABEL_TEXT = "Canvas";
const LABEL_FONT = `${26 * SCALE}px sans-serif`;
const LABEL_ANIMATION_DELAY = 1000;
const LABEL_ANIMATION_DURATION = 500;
const label = {
    state: OpacityAnimation.Hide,
    animationDuration: LABEL_ANIMATION_DURATION,
    animationDelay: LABEL_ANIMATION_DELAY
}

$(document).ready(function () {
    const canvas = document.getElementById("art-canvas");
    const ctx = canvas.getContext("2d");

    // Element-level click detection (checking order represents layer stack order, e.g. check above layer first)
    $(canvas).click((event) => {
        const clickPoint = mapClickEventToPointOnElement(event, canvas);

        // Check if click was within the center disc
        if (ctx.isPointInPath(centerDisc.path, clickPoint.x, clickPoint.y)) {
            fireDiscAnimation(centerDisc);
            fireLabelAnimation(label);
            fireTriangleCircleAnimation(fgTriangleCircle);
            fireTriangleCircleAnimation(bgTriangleCircle);
            return;
        }

        // Check if click was within any of the foreground triangle circle
        if (isPointInPaths(ctx, fgTriangleCircle.paths, clickPoint.x, clickPoint.y, fgTriangleCircle.rotation)) {
            fireTriangleCircleAnimation(fgTriangleCircle);
            return;
        }

        // Check if click was within any of the background triangle circle
        if (isPointInPaths(ctx, bgTriangleCircle.paths, clickPoint.x, clickPoint.y, bgTriangleCircle.rotation)) {
            fireTriangleCircleAnimation(bgTriangleCircle);
        }
    });

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Make coordinates relative to canvas center (simplifies drawing)
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    ctx.translate(centerX, centerY);

    draw(canvas, ctx);
});

function mapClickEventToPointOnElement(event, element) {
    return {
        x: event.offsetX * (element.width / element.clientWidth),
        y: event.offsetY * (element.height / element.clientHeight)
    }
}

// Check if the given point (x,y) is within the given paths (Path2D)
// returns true if any of the paths contain the point, false otherwise
function isPointInPaths(ctx, paths, x, y, rotation = 0) {
    // Rotate to be able to perform click detection with the transformed matrix
    ctx.rotate(rotation);
    const clickInPath = paths.some((p) => ctx.isPointInPath(p, x, y) || ctx.isPointInStroke(p, x, y));
    // Undo rotation to cover our tracks
    ctx.rotate(-rotation);
    return clickInPath;
}

// Recalculate animation start time to invert animation progress
// (e.g. if animation is almost finished, inverting the progress will make the animation act as if it just started)
function startOfInvertedAnimation(start, elapsed, duration) {
    return start + 2 * elapsed - duration
}

function fireDiscAnimation(disc) {
    if (disc.animation != null) {
        // Already animating, so toggle direction and invert progress
        disc.animation = {
            type: disc.animation.type === RadiusAnimation.Grow ? RadiusAnimation.Shrink : RadiusAnimation.Grow,
            start: startOfInvertedAnimation(
                disc.animation.start, disc.animation.elapsed, disc.animationDuration
            )
        }
    } else {
        // Start animation, with the opposite effect of the previous one
        disc.animation = {
            type: disc.grown ? RadiusAnimation.Shrink : RadiusAnimation.Grow
        }
    }
}

function fireLabelAnimation(label) {
    if (label.animation != null) {
        // Already animating, so toggle direction and invert progress
        label.animation = {
            type: label.animation.type === OpacityAnimation.Show ? OpacityAnimation.Hide : OpacityAnimation.Show,
            start: startOfInvertedAnimation(
                label.animation.start, label.animation.elapsed, label.animationDuration
            ) - label.animationDelay
        }
    } else {
        // Start animation, with the opposite effect of the previous one
        label.animation = {
            type: label.state === OpacityAnimation.Show ? OpacityAnimation.Hide : OpacityAnimation.Show
        }
    }
}

function fireTriangleCircleAnimation(triangleCircle) {
    if (triangleCircle.animation != null) {
        // Already animating, so toggle direction and invert progress
        triangleCircle.animation = {
            type: triangleCircle.animation.type === Rotation.Clockwise ? Rotation.CounterClockwise : Rotation.Clockwise,
            start: startOfInvertedAnimation(
                triangleCircle.animation.start, triangleCircle.animation.elapsed, TRIANGLE_ANIMATION_DURATION
            )
        };
    } else {
        // Start animation, in the opposite direction of the previous one
        triangleCircle.animation = {
            type: triangleCircle.state === Rotation.Clockwise ?
                Rotation.CounterClockwise : Rotation.Clockwise
        };
    }
}

function drawCenterDisc(ctx, timestamp, centerDisc) {
    let discHue = centerDisc.grown ? DISC_HUE_GROWN : DISC_HUE_INITIAL;
    if (centerDisc.animation != null) {
        if (centerDisc.animation.start === undefined) {
            centerDisc.animation.start = timestamp;
        }
        centerDisc.animation.elapsed = timestamp - centerDisc.animation.start;
        const animationProgress = centerDisc.animation.elapsed / centerDisc.animationDuration;
        discHue =
            DISC_HUE_INITIAL +
            (DISC_HUE_GROWN - DISC_HUE_INITIAL)
            * (centerDisc.animation.type === RadiusAnimation.Grow ?
                    animationProgress : 1 - animationProgress
            );
        if (animationProgress >= 1) {
            centerDisc.grown = centerDisc.animation.type === RadiusAnimation.Grow;
            centerDisc.animation = null;
            centerDisc.radius = centerDisc.grown ? DISC_RADIUS_GROWN : DISC_RADIUS_INITIAL;
        } else {
            const easing = centerDisc.animation.type === RadiusAnimation.Shrink ?
                1 - easeInOut(animationProgress) :
                easeInOut(animationProgress);

            centerDisc.radius =
                DISC_RADIUS_INITIAL +
                (DISC_RADIUS_GROWN - DISC_RADIUS_INITIAL)
                * easing;
        }
    }

    const path = new Path2D();
    path.arc(0, 0, centerDisc.radius, 0, 2 * Math.PI);
    ctx.fillStyle = `hsl(${discHue}, 100%, 57%)`;
    ctx.fill(path);
    centerDisc.path = path;
}

function drawLabel(ctx, timestamp, label) {
    if (label.animation != null) {
        if (label.animation.start === undefined) {
            label.animation.start = timestamp;
        }
        label.animation.elapsed = timestamp - label.animation.start;
        const animationDelay = label.animation.type === OpacityAnimation.Show ? label.animationDelay : 0;
        const animationProgress = label.animation.elapsed > animationDelay ?
            (label.animation.elapsed - animationDelay) / LABEL_ANIMATION_DURATION : 0;
        if (animationProgress >= 1) {
            label.state = label.animation.type;
            label.animation = null;
            label.opacity = label.state === OpacityAnimation.Show ? 1 : 0;
        } else {
            label.opacity = label.animation.type === OpacityAnimation.Hide ?
                1 - easeInOut(animationProgress) :
                easeInOut(animationProgress);
        }
    } else {
        label.opacity = label.state === OpacityAnimation.Show ? 1 : 0;
    }

    ctx.fillStyle = `rgba(255,255,255,${label.opacity})`;
    ctx.font = LABEL_FONT;
    const labelMetrics = ctx.measureText(LABEL_TEXT);
    ctx.fillText(
        LABEL_TEXT,
        -labelMetrics.width / 2,
        -(labelMetrics.actualBoundingBoxDescent - labelMetrics.actualBoundingBoxAscent) / 2
    );
}

function fillTriangle(ctx, x1, y1, x2, y2, x3, y3) {
    const path = new Path2D();
    path.moveTo(x1, y1);
    path.lineTo(x2, y2);
    path.lineTo(x3, y3);
    path.closePath();
    ctx.stroke(path);
    ctx.fill(path);
    return path;
}

// Fill triangles arranged in a circle
function fillTriangleCircle(ctx, sideWidth, rounding) {
    const triangleHeight = Math.sqrt(sideWidth ** 2 * 3 / 4);

    return [
        fillTriangle(ctx,
            0, -(0.5 * sideWidth + triangleHeight) - rounding,
            sideWidth * 0.5, -sideWidth * 0.5 - rounding,
            -sideWidth * 0.5, -sideWidth * 0.5 - rounding
        ),
        fillTriangle(ctx,
            sideWidth * 0.5 + rounding, -sideWidth * 0.5,
            sideWidth * 0.5 + rounding, sideWidth * 0.5,
            (0.5 * sideWidth + triangleHeight) + rounding, 0
        ),
        fillTriangle(ctx,
            sideWidth * 0.5, sideWidth * 0.5 + rounding,
            -sideWidth * 0.5, sideWidth * 0.5 + rounding,
            0, (0.5 * sideWidth + triangleHeight) + rounding
        ),
        fillTriangle(ctx,
            -sideWidth * 0.5 - rounding, sideWidth * 0.5,
            -sideWidth * 0.5 - rounding, -sideWidth * 0.5,
            -(0.5 * sideWidth + triangleHeight) - rounding, 0
        )
    ];
}

// Draw triangles arranged in a circle
function drawTriangleCircle(ctx, timestamp, triangleCircle) {
    if (triangleCircle.animation != null) {
        if (triangleCircle.animation.start === undefined) {
            triangleCircle.animation.start = timestamp;
        }
        triangleCircle.animation.elapsed = timestamp - triangleCircle.animation.start;
        const animationProgress = triangleCircle.animation.elapsed / triangleCircle.animationDuration;
        if (animationProgress >= 1) {
            triangleCircle.state = triangleCircle.animation.type;
            triangleCircle.animation = null;
        } else {
            const easing = triangleCircle.animation.type === Rotation.Clockwise ?
                easeInOut(animationProgress) :
                1 - easeInOut(animationProgress);

            triangleCircle.rotation = (triangleCircle.rotationOffset !== undefined ? triangleCircle.rotationOffset : 0) +
                (2 * Math.PI) * easing;
        }
    } else {
        triangleCircle.rotation = triangleCircle.rotationOffset !== undefined ? triangleCircle.rotationOffset : 0;
    }

    ctx.rotate(triangleCircle.rotation);

    // Rounded corners
    ctx.lineWidth = TRIANGLE_ROUNDING * TRIANGLE_PADDING_FACTOR;
    ctx.lineJoin = "round";

    ctx.fillStyle = triangleCircle.fill;
    ctx.strokeStyle = triangleCircle.fill;

    // Draw triangles paths, and store them for later use in click detection
    triangleCircle.paths = fillTriangleCircle(ctx, TRIANGLE_SIDE, TRIANGLE_ROUNDING);

    // Reset rotation to cover our tracks
    ctx.rotate(-triangleCircle.rotation);
}

// Draw a single frame with the current paths (objects) values
// (requires both canvas and context to avoid the need to retrieve the context every single frame)
function draw(canvas, ctx, timestamp) {

    // Clear any existing drawing
    ctx.clearRect(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawTriangleCircle(ctx, timestamp, bgTriangleCircle);

    drawTriangleCircle(ctx, timestamp, fgTriangleCircle);

    drawCenterDisc(ctx, timestamp, centerDisc);

    drawLabel(ctx, timestamp, label);

    // Continue the drawing loop
    window.requestAnimationFrame((timestamp) => draw(canvas, ctx, timestamp));

}
