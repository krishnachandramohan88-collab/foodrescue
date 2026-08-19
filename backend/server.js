const express = require("express");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Main project folder
const ROOT = path.join(__dirname, "..");

// Serve food.html, food.js, CSS, images etc.
app.use(express.static(ROOT));

// Homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(ROOT, "food.html"));
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "FoodRescue AI Backend is running 🚀",
        version: "2.0.0"
    });
});

// Food analysis
app.post("/api/analyze-food", (req, res) => {

    const {
        foodName,
        temperature,
        hours,
        storage
    } = req.body;

    if (!foodName) {
        return res.status(400).json({
            success: false,
            message: "Food name is required"
        });
    }

    const temp = Number(temperature) || 25;
    const time = Number(hours) || 0;

    let score = 90;

    if (time >= 6) {
        score = 25;
    } else if (time >= 3) {
        score = 55;
    }

    if (temp > 30) {
        score -= 20;
    } else if (temp > 25) {
        score -= 10;
    }

    if (storage === "refrigerated") {
        score += 10;
    }

    score = Math.max(0, Math.min(100, score));

    let risk;
    let message;
    let recommendation;

    if (score < 40) {
        risk = "HIGH";
        message = "High spoilage risk detected.";
        recommendation = "Alert NGO or food rescue partner immediately.";
    } else if (score < 70) {
        risk = "MEDIUM";
        message = "Moderate spoilage risk detected.";
        recommendation = "Donate or distribute the food soon.";
    } else {
        risk = "LOW";
        message = "Food appears relatively safe.";
        recommendation = "Continue monitoring the food.";
    }

    res.json({
        success: true,
        foodName,
        risk,
        freshnessScore: score,
        temperature: temp,
        hours: time,
        storage: storage || "room",
        message,
        recommendation
    });
});

// Rescue network
app.get("/api/rescue-network", (req, res) => {
    res.json({
        success: true,
        network: [
            {
                name: "Local NGO Partner",
                status: "Available",
                distance: "2.4 km"
            },
            {
                name: "Community Food Bank",
                status: "Available",
                distance: "3.1 km"
            },
            {
                name: "Food Distribution Center",
                status: "Available",
                distance: "4.7 km"
            }
        ]
    });
});

// Rescue request
app.post("/api/rescue", (req, res) => {

    const {
        foodName,
        quantity,
        location,
        contact
    } = req.body;

    if (!foodName || !quantity || !location) {
        return res.status(400).json({
            success: false,
            message: "Food name, quantity and location are required."
        });
    }

    console.log("NEW FOOD RESCUE REQUEST");
    console.log({
        foodName,
        quantity,
        location,
        contact
    });

    res.json({
        success: true,
        message: "Rescue request submitted successfully.",
        request: {
            foodName,
            quantity,
            location,
            contact
        }
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Start
app.listen(PORT, () => {

    console.log("");
    console.log("========================================");
    console.log("🍽️  FOODRESCUE AI BACKEND");
    console.log("========================================");
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`🌐 Website: http://localhost:${PORT}`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
    console.log("========================================");
});