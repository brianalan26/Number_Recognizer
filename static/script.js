const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

// Initialize canvas with black background
function initializeCanvas() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

initializeCanvas(); // Set up when page loads

let drawing = false;

// Get correct mouse/touch positions
function getPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX || event.touches[0].clientX) - rect.left,
        y: (event.clientY || event.touches[0].clientY) - rect.top
    };
}

// Start drawing
canvas.addEventListener("mousedown", (event) => {
    drawing = true;
    ctx.beginPath();
    const pos = getPosition(event);
    ctx.moveTo(pos.x, pos.y);
});

canvas.addEventListener("touchstart", (event) => {
    event.preventDefault(); // Prevent scrolling on touch
    drawing = true;
    ctx.beginPath();
    const pos = getPosition(event);
    ctx.moveTo(pos.x, pos.y);
});

// Draw on canvas
function draw(event) {
    if (!drawing) return;
    event.preventDefault(); // Prevent scrolling on touch

    ctx.strokeStyle = "white";  // Draw in white
    ctx.lineWidth = 15;
    ctx.lineCap = "round";

    const pos = getPosition(event);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

canvas.addEventListener("mousemove", draw);
canvas.addEventListener("touchmove", draw);

// Stop drawing
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mouseleave", () => drawing = false);
canvas.addEventListener("touchend", () => drawing = false);

// Clear canvas and refresh the page
function clearCanvas() {
    // Clear canvas immediately
    initializeCanvas();

    // Refresh the page
    setTimeout(function() {
        window.location.reload();  // Reload the page after clearing
    }, 300);  // Add a small delay before page reload for a smoother user experience
}

// Predict digit function
async function predictDigit() {
    const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));

    const formData = new FormData();
    formData.append("file", imageBlob, "digit.png");

    try {
        const response = await fetch("/predict/", {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("Failed to get response from server.");

        const data = await response.json();
        document.getElementById("result").innerText = `Predicted Number: ${data.predicted_digit}`;
    } catch (error) {
        console.error("Prediction error:", error);
        document.getElementById("result").innerText = "Error in prediction!";
    }
}

// Attach clear function to button
document.getElementById("clearBtn").addEventListener("click", clearCanvas);
