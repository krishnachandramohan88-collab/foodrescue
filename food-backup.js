/* =====================================================
   FOODRESCUE FRONTEND
===================================================== */

const API_URL = "http://localhost:5000";

let countdownTimer = null;


/* =====================================================
   PAGE LOAD
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const imageInput =
            document.getElementById(
                "foodImage"
            );

        const analyzeButton =
            document.getElementById(
                "analyzeBtn"
            );


        if (!imageInput) {

            console.error(
                "❌ foodImage element not found."
            );

            return;

        }


        if (!analyzeButton) {

            console.error(
                "❌ analyzeBtn element not found."
            );

            return;

        }


        imageInput.addEventListener(
            "change",
            previewFood
        );


        analyzeButton.addEventListener(
            "click",
            analyzeFood
        );


        console.log(
            "🍽️ FoodRescue frontend ready."
        );

    }
);


/* =====================================================
   PHOTO PREVIEW
===================================================== */

function previewFood() {

    const input =
        document.getElementById(
            "foodImage"
        );

    const preview =
        document.getElementById(
            "imagePreview"
        );


    if (
        !input ||
        !preview ||
        !input.files ||
        !input.files.length
    ) {

        return;

    }


    const file =
        input.files[0];


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        alert(
            "❌ Please select a valid image."
        );

        input.value = "";

        return;

    }


    if (
        file.size >
        10 * 1024 * 1024
    ) {

        alert(
            "❌ Image must be smaller than 10 MB."
        );

        input.value = "";

        return;

    }


    const imageURL =
        URL.createObjectURL(
            file
        );


    preview.src =
        imageURL;

    preview.style.display =
        "block";

}


/* =====================================================
   ANALYZE FOOD
===================================================== */

async function analyzeFood() {

    const input =
        document.getElementById(
            "foodImage"
        );

    const result =
        document.getElementById(
            "resultContent"
        );

    const button =
        document.getElementById(
            "analyzeBtn"
        );


    /* -----------------------------------------
       CHECK IMAGE
    ----------------------------------------- */

    if (
        !input ||
        !input.files ||
        !input.files.length
    ) {

        alert(
            "📷 Please upload or capture a food photo first."
        );

        return;

    }


    /* -----------------------------------------
       GET VALUES
    ----------------------------------------- */

    const foodType =
        document.getElementById(
            "foodType"
        ).value;

    const temperature =
        document.getElementById(
            "foodTemperature"
        ).value;

    const preparation =
        document.getElementById(
            "hoursSincePreparation"
        ).value;

    const storage =
        document.getElementById(
            "storage"
        ).value;


    /* -----------------------------------------
       VALIDATION
    ----------------------------------------- */

    if (
        temperature === ""
    ) {

        alert(
            "🌡️ Please enter temperature."
        );

        return;

    }


    if (
        preparation === ""
    ) {

        alert(
            "⏱️ Please enter hours since preparation."
        );

        return;

    }


    /* -----------------------------------------
       LOADING
    ----------------------------------------- */

    result.innerHTML = `

        <div class="rescue-loading">

            🤖

            <br><br>

            <strong>
                FoodRescue is analyzing...
            </strong>

            <br><br>

            Checking food conditions,
            storage and rescue risk...

        </div>

    `;


    button.disabled =
        true;

    button.innerText =
        "🤖 Analyzing...";


    /* -----------------------------------------
       FORM DATA
    ----------------------------------------- */

    const formData =
        new FormData();


    formData.append(
        "foodImage",
        input.files[0]
    );


    formData.append(
        "foodType",
        foodType
    );


    formData.append(
        "temperature",
        temperature
    );


    formData.append(
        "hoursSincePreparation",
        preparation
    );


    formData.append(
        "storage",
        storage
    );


    /* -----------------------------------------
       API REQUEST
    ----------------------------------------- */

    try {

        const response =
            await fetch(
                `${API_URL}/api/analyze-food`,
                {

                    method:
                        "POST",

                    body:
                        formData

                }
            );


        const data =
            await response.json();


        console.log(
            "FoodRescue Analysis:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Food analysis failed."
            );

        }


        displayAnalysis(
            data
        );

    }

    catch (error) {

        console.error(
            "Analysis Error:",
            error
        );


        result.innerHTML = `

            <div class="error-box">

                <strong>
                    ❌ Analysis Failed
                </strong>

                <br><br>

                ${escapeHTML(
                    error.message
                )}

                <br><br>

                Make sure your backend is running:

                <br><br>

                <strong>
                    http://localhost:5000
                </strong>

            </div>

        `;

    }

    finally {

        button.disabled =
            false;

        button.innerText =
            "📊 Analyze Food";

    }

}


/* =====================================================
   DISPLAY ANALYSIS
===================================================== */

function displayAnalysis(
    data
) {

    const result =
        document.getElementById(
            "resultContent"
        );


    const analysis =
        data.analysis ||
        {};

    const future =
        data.futureRisk ||
        {};

    const alertData =
        data.alert ||
        {};


    const foodType =
        analysis.foodType ||
        "Prepared Food";


    const temperature =
        analysis.temperature ??
        "N/A";


    const preparation =
        analysis.hoursSincePreparation ??
        "N/A";


    const storage =
        analysis.storage ||
        "N/A";


    const freshness =
        analysis.freshnessScore ??
        "N/A";


    const risk =
        analysis.currentRisk ||
        "UNKNOWN";


    const status =
        analysis.status ||
        "ANALYSIS COMPLETE";


    const after1 =
        future.after1Hour ||
        "N/A";


    const after2 =
        future.after2Hours ||
        "N/A";


    const after3 =
        future.after3Hours ||
        "N/A";


    const rescueHours =
        Number(
            alertData.rescueHours ||
            3
        );


    const message =
        alertData.message ||
        "Food should be reviewed within the rescue window.";


    result.innerHTML = `

        <div class="ai-analysis">

            <div class="analysis-status">

                ${escapeHTML(status)}

            </div>


            <h3>
                📊 FoodRescue Assessment
            </h3>


            <br>


            <div class="analysis-grid">


                <div class="analysis-box">

                    <span>
                        🍛 Food
                    </span>

                    <strong>
                        ${escapeHTML(foodType)}
                    </strong>

                </div>


                <div class="analysis-box">

                    <span>
                        🌡️ Temperature
                    </span>

                    <strong>
                        ${temperature} °C
                    </strong>

                </div>


                <div class="analysis-box">

                    <span>
                        ⏱️ Preparation
                    </span>

                    <strong>
                        ${preparation} hours ago
                    </strong>

                </div>


                <div class="analysis-box">

                    <span>
                        ❄️ Storage
                    </span>

                    <strong>
                        ${formatStorage(storage)}
                    </strong>

                </div>


                <div class="analysis-box">

                    <span>
                        🟢 Freshness
                    </span>

                    <strong>
                        ${freshness}%
                    </strong>

                </div>


                <div class="analysis-box">

                    <span>
                        ⚠️ Current Risk
                    </span>

                    <strong>
                        ${escapeHTML(risk)}
                    </strong>

                </div>

            </div>


            <h3 class="future-title">

                🔮 Future Food Spoilage Risk

            </h3>


            <div class="future-risk">


                <div>

                    After 1 Hour

                    <strong>
                        ${after1}
                    </strong>

                </div>


                <div>

                    After 2 Hours

                    <strong>
                        ${after2}
                    </strong>

                </div>


                <div>

                    After 3 Hours

                    <strong>
                        ${after3}
                    </strong>

                </div>


            </div>


            <div class="smart-alert">

                <div class="smart-alert-icon">

                    🚨

                </div>


                <div>

                    <strong>
                        FoodRescue Smart Alert
                    </strong>

                    <p>
                        ${escapeHTML(message)}
                    </p>


                    <div
                        id="countdown"
                        class="countdown"
                    >

                        Loading...

                    </div>

                </div>

            </div>


            <button
                id="rescueBtn"
                class="btn primary full"
                type="button"
            >

                🚑 Rescue This Food

            </button>


            <div
                id="networkResult"
                style="margin-top:15px;"
            ></div>


        </div>

    `;


    startCountdown(
        rescueHours * 60 * 60
    );


    const rescueButton =
        document.getElementById(
            "rescueBtn"
        );


    if (
        rescueButton
    ) {

        rescueButton.addEventListener(
            "click",
            rescueFood
        );

    }

}


/* =====================================================
   STORAGE FORMAT
===================================================== */

function formatStorage(
    storage
) {

    const map = {

        room:
            "Room Temperature",

        refrigerator:
            "Refrigerator",

        freezer:
            "Freezer",

        "hot-holding":
            "Hot Holding",

        "not-measured":
            "Not Measured"

    };


    return escapeHTML(
        map[storage] ||
        storage ||
        "Not Available"
    );

}


/* =====================================================
   COUNTDOWN
===================================================== */

function startCountdown(
    seconds
) {

    if (
        countdownTimer
    ) {

        clearInterval(
            countdownTimer
        );

    }


    let remaining =
        Number(seconds);


    const countdown =
        document.getElementById(
            "countdown"
        );


    if (
        !countdown
    ) {

        return;

    }


    function update() {

        if (
            remaining <= 0
        ) {

            countdown.innerText =
                "⚠️ RESCUE WINDOW CLOSED";

            clearInterval(
                countdownTimer
            );

            return;

        }


        const hours =
            Math.floor(
                remaining / 3600
            );


        const minutes =
            Math.floor(
                (
                    remaining % 3600
                ) / 60
            );


        const secs =
            remaining % 60;


        countdown.innerText =

            "⏳ " +

            String(hours)
                .padStart(
                    2,
                    "0"
                ) +

            ":" +

            String(minutes)
                .padStart(
                    2,
                    "0"
                ) +

            ":" +

            String(secs)
                .padStart(
                    2,
                    "0"
                );


        remaining--;

    }


    update();


    countdownTimer =
        setInterval(
            update,
            1000
        );

}


/* =====================================================
   RESCUE FOOD
===================================================== */

async function rescueFood() {

    const networkResult =
        document.getElementById(
            "networkResult"
        );


    if (
        !networkResult
    ) {

        return;

    }


    networkResult.innerHTML = `

        <div class="rescue-loading">

            🤝 Activating rescue network...

            <br><br>

            Finding available NGO...

        </div>

    `;


    try {

        const response =
            await fetch(
                `${API_URL}/api/rescue-network`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Rescue network unavailable."
            );

        }


        const network =
            data.network ||
            {};


        const ngos =
            network.ngos ||
            [];


        const ngo =
            ngos.find(
                item =>
                    item.status ===
                    "AVAILABLE"
            );


        const people =
            network.peopleInNeed ||
            {};


        if (
            !ngo
        ) {

            networkResult.innerHTML = `

                <div class="error-box">

                    ⚠️ No NGO currently available.

                </div>

            `;

            return;

        }


        const rescueID =
            "FR-" +
            Date.now()
                .toString()
                .slice(-6);


        networkResult.innerHTML = `

            <div class="network-card">

                <h3>
                    ✅ Rescue Request Created
                </h3>


                <div class="network-item">

                    <strong>
                        Rescue ID
                    </strong>

                    <span>
                        ${escapeHTML(rescueID)}
                    </span>

                </div>


                <div class="network-item">

                    <strong>
                        🤝 Matched NGO
                    </strong>

                    <span>
                        ${escapeHTML(ngo.name)}
                    </span>

                </div>


                <div class="network-item">

                    <strong>
                        📍 Location
                    </strong>

                    <span>
                        ${escapeHTML(ngo.location)}
                    </span>

                </div>


                <div class="network-item">

                    <strong>
                        📏 Distance
                    </strong>

                    <span>
                        ${escapeHTML(ngo.distance)}
                    </span>

                </div>


                <div class="network-item">

                    <strong>
                        👨‍👩‍👧 Families Waiting
                    </strong>

                    <span>
                        ${people.familiesWaiting || 0}
                    </span>

                </div>


                <div class="network-item">

                    <strong>
                        🍱 Meals Needed
                    </strong>

                    <span>
                        ${people.estimatedMealsNeeded || 0}
                    </span>

                </div>


                <br>


                <strong
                    style="color:#63d695;"
                >

                    🚑 Rescue network activated.

                </strong>

            </div>

        `;

    }

    catch (error) {

        console.error(
            "Rescue Error:",
            error
        );


        networkResult.innerHTML = `

            <div class="error-box">

                ❌ Could not connect to rescue network.

                <br><br>

                ${escapeHTML(
                    error.message
                )}

            </div>

        `;

    }

}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            value ?? ""
        );


    return div.innerHTML;

}