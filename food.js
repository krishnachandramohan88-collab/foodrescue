/* =========================================================
   FOODRESCUE AI - FRONTEND
========================================================= */

const API_URL = "http://localhost:5000";

document.addEventListener("DOMContentLoaded", () => {

    console.log("FoodRescue AI loaded");

    // Find Analyze button
    const analyzeBtn =
        document.getElementById("analyzeBtn");

    if (!analyzeBtn) {
        console.error("Analyze button not found!");
        return;
    }

    analyzeBtn.addEventListener("click", analyzeFood);

});


/* =========================================================
   ANALYZE FOOD
========================================================= */

async function analyzeFood() {

    console.log("Analyze button clicked");

    // Try multiple possible input IDs
    const foodInput =
        document.getElementById("foodName") ||
        document.getElementById("foodType") ||
        document.getElementById("food");

    const temperatureInput =
        document.getElementById("temperature") ||
        document.getElementById("temp");

    const hoursInput =
        document.getElementById("hours") ||
        document.getElementById("time");

    const storageInput =
        document.getElementById("storage");

    if (!foodInput) {
        alert("Food name input nahi mila.");
        return;
    }

    const foodName =
        foodInput.value.trim();

    const temperature =
        temperatureInput
            ? temperatureInput.value
            : 25;

    const hours =
        hoursInput
            ? hoursInput.value
            : 0;

    const storage =
        storageInput
            ? storageInput.value
            : "room";


    if (!foodName) {
        alert("Please enter food name.");
        foodInput.focus();
        return;
    }


    // Button loading state
    const analyzeBtn =
        document.getElementById("analyzeBtn");

    const originalText =
        analyzeBtn.innerText;

    analyzeBtn.disabled = true;
    analyzeBtn.innerText = "🔄 Analyzing...";


    try {

        console.log("Sending data:", {
            foodName,
            temperature,
            hours,
            storage
        });


        const response =
            await fetch(
                `${API_URL}/api/analyze-food`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        foodName,
                        temperature,
                        hours,
                        storage
                    })
                }
            );


        console.log(
            "Response status:",
            response.status
        );


        const data =
            await response.json();

        console.log(
            "Backend response:",
            data
        );


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Food analysis failed"
            );

        }


        showAnalysisResult(data);


    } catch (error) {

        console.error(
            "Analysis Error:",
            error
        );

        alert(
            "Unable to analyze food.\n\n" +
            "Error: " +
            error.message
        );

    } finally {

        analyzeBtn.disabled = false;
        analyzeBtn.innerText =
            originalText;

    }

}


/* =========================================================
   SHOW RESULT
========================================================= */

function showAnalysisResult(data) {

    console.log(
        "Showing result:",
        data
    );


    // Try common result containers
    let result =
        document.getElementById(
            "analysisResult"
        ) ||
        document.getElementById(
            "result"
        ) ||
        document.getElementById(
            "resultContainer"
        );


    // If result container doesn't exist,
    // create one automatically.
    if (!result) {

        result =
            document.createElement("div");

        result.id =
            "analysisResult";

        result.style.marginTop =
            "25px";

        result.style.padding =
            "20px";

        result.style.borderRadius =
            "15px";

        result.style.background =
            "#f5f5f5";

        const analyzeBtn =
            document.getElementById(
                "analyzeBtn"
            );

        analyzeBtn.parentNode
            .appendChild(result);
    }


    let riskIcon = "🟢";

    if (data.risk === "MEDIUM") {
        riskIcon = "🟡";
    }

    if (data.risk === "HIGH") {
        riskIcon = "🔴";
    }


    result.innerHTML = `

        <h2>
            ${riskIcon}
            Food Analysis Result
        </h2>

        <h3>
            ${escapeHTML(data.foodName)}
        </h3>

        <p>
            <strong>Risk Level:</strong>
            ${data.risk}
        </p>

        <p>
            <strong>Freshness Score:</strong>
            ${data.freshnessScore}/100
        </p>

        <p>
            <strong>Temperature:</strong>
            ${data.temperature}°C
        </p>

        <p>
            <strong>Time:</strong>
            ${data.hours} hours
        </p>

        <p>
            <strong>Storage:</strong>
            ${data.storage}
        </p>

        <p>
            <strong>Status:</strong>
            ${escapeHTML(data.message)}
        </p>

        <p>
            <strong>Recommendation:</strong>
            ${escapeHTML(data.recommendation)}
        </p>

    `;


    // Scroll to result
    result.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* =========================================================
   SECURITY
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}