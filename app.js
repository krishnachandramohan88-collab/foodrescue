/* =====================================================
   REPLATE AI - COMPLETE RESCUE DEMO
   No external AI API required
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /* =============================================
           HTML ELEMENTS
        ============================================= */

        const foodForm =
            document.getElementById(
                "foodForm"
            );

        const imageInput =
            document.getElementById(
                "foodImage"
            );

        const imagePreview =
            document.getElementById(
                "imagePreview"
            );

        const uploadBox =
            document.querySelector(
                ".upload-box"
            );

        const fileLabel =
            document.getElementById(
                "fileLabel"
            );

        const analyzeButton =
            document.getElementById(
                "analyzeButton"
            );

        const emptyResult =
            document.getElementById(
                "emptyResult"
            );

        const resultContent =
            document.getElementById(
                "resultContent"
            );

        const aiStatus =
            document.getElementById(
                "aiStatus"
            );

        const statusDetail =
            document.getElementById(
                "statusDetail"
            );

        const toast =
            document.getElementById(
                "toast"
            );

        const networkPanel =
            document.getElementById(
                "networkPanel"
            );

        const networkStatus =
            document.getElementById(
                "networkStatus"
            );

        const networkContent =
            document.getElementById(
                "networkContent"
            );

        const publicAlert =
            document.getElementById(
                "publicAlert"
            );

        const publicAlertMessage =
            document.getElementById(
                "publicAlertMessage"
            );


        let previewUrl =
            null;

        let countdownTimer =
            null;

        let rescueState =
            null;


        /* =============================================
           SAMPLE PATNA NGO NETWORK
        ============================================= */

        const ngoData = [

            {
                name:
                    "Helping Hands",

                area:
                    "Kankarbagh, Patna",

                distance:
                    2.4,

                urgency:
                    "HIGH",

                needScore:
                    100,

                mealsNeeded:
                    40,

                capacity:
                    35,

                deliveryPartner:
                    "Amit Kumar"
            },

            {
                name:
                    "Food For All",

                area:
                    "Rajendra Nagar, Patna",

                distance:
                    4.1,

                urgency:
                    "MEDIUM",

                needScore:
                    72,

                mealsNeeded:
                    25,

                capacity:
                    25,

                deliveryPartner:
                    "Neha Singh"
            },

            {
                name:
                    "Hope Community",

                area:
                    "Patliputra, Patna",

                distance:
                    6.8,

                urgency:
                    "LOW",

                needScore:
                    45,

                mealsNeeded:
                    15,

                capacity:
                    15,

                deliveryPartner:
                    "Rahul Verma"
            }

        ];


        /* =============================================
           SYSTEM STATUS
        ============================================= */

        aiStatus.textContent =
            "Demo System Ready";

        aiStatus.className =
            "status online";

        statusDetail.textContent =
            "Analysis, safety verification, NGO matching and rescue tracking are ready.";


        /* =============================================
           SAFE HTML
        ============================================= */

        function escapeHtml(
            value
        ) {

            return String(
                value ?? ""
            )
                .replaceAll(
                    "&",
                    "&amp;"
                )
                .replaceAll(
                    "<",
                    "&lt;"
                )
                .replaceAll(
                    ">",
                    "&gt;"
                )
                .replaceAll(
                    '"',
                    "&quot;"
                )
                .replaceAll(
                    "'",
                    "&#039;"
                );
        }


        /* =============================================
           TOAST MESSAGE
        ============================================= */

        function showToast(
            message
        ) {

            toast.textContent =
                message;

            toast.classList.add(
                "show"
            );

            clearTimeout(
                showToast.timer
            );

            showToast.timer =
                setTimeout(
                    () => {

                        toast.classList.remove(
                            "show"
                        );

                    },
                    3200
                );
        }


        /* =============================================
           FOOD PHOTO PREVIEW
        ============================================= */

        imageInput.addEventListener(
            "change",
            () => {

                const file =
                    imageInput.files[0];


                if (!file) {

                    imagePreview.src =
                        "";

                    imagePreview.classList.add(
                        "hidden"
                    );

                    uploadBox.classList.remove(
                        "has-image"
                    );

                    fileLabel.textContent =
                        "JPG, PNG or WEBP • Maximum 5 MB";

                    return;
                }


                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {

                    imageInput.value =
                        "";

                    showToast(
                        "Please choose a valid image."
                    );

                    return;
                }


                if (
                    file.size >
                    5 * 1024 * 1024
                ) {

                    imageInput.value =
                        "";

                    showToast(
                        "Image must be smaller than 5 MB."
                    );

                    return;
                }


                if (previewUrl) {

                    URL.revokeObjectURL(
                        previewUrl
                    );
                }


                previewUrl =
                    URL.createObjectURL(
                        file
                    );


                imagePreview.src =
                    previewUrl;


                imagePreview.classList.remove(
                    "hidden"
                );


                uploadBox.classList.add(
                    "has-image"
                );


                fileLabel.textContent =
                    `${file.name} • Click to change`;
            }
        );


        /* =============================================
           DEMO FOOD ANALYSIS
        ============================================= */

        function analyzeFood(
            formData
        ) {

            const foodName =
                String(
                    formData.get(
                        "foodName"
                    ) ||
                    "Prepared food"
                ).trim();


            const foodType =
                String(
                    formData.get(
                        "foodType"
                    ) ||
                    "Prepared meal"
                );


            const temperature =
                Number(
                    formData.get(
                        "temperature"
                    )
                );


            const hours =
                Number(
                    formData.get(
                        "hoursSincePreparation"
                    )
                );


            const storage =
                String(
                    formData.get(
                        "storage"
                    ) ||
                    "Not measured"
                );


            const packaging =
                String(
                    formData.get(
                        "packaging"
                    ) ||
                    "Open"
                );


            const quantity =
                Math.max(
                    1,
                    Math.round(
                        Number(
                            formData.get(
                                "quantity"
                            )
                        ) || 1
                    )
                );


            let score =
                1;

            const reasons =
                [];


            /* TIME SCORE */

            if (hours >= 6) {

                score +=
                    5;

                reasons.push(
                    `${hours} hours since preparation creates high urgency.`
                );

            } else if (
                hours >= 4
            ) {

                score +=
                    4;

                reasons.push(
                    `${hours} hours of declared holding time increases risk.`
                );

            } else if (
                hours >= 2
            ) {

                score +=
                    2;

                reasons.push(
                    `${hours} hours of holding requires prompt review.`
                );

            } else {

                reasons.push(
                    "Preparation time is relatively recent."
                );
            }


            /* STORAGE SCORE */

            if (
                storage ===
                "Room temperature"
            ) {

                if (
                    temperature > 5 &&
                    temperature < 60
                ) {

                    score +=
                        4;

                } else {

                    score +=
                        2;
                }


                reasons.push(
                    `Room-temperature storage at ${temperature}°C increases urgency.`
                );

            } else if (
                storage ===
                "Not measured"
            ) {

                score +=
                    3;

                reasons.push(
                    "Storage condition was not measured."
                );

            } else if (
                storage ===
                    "Refrigerated" &&
                temperature > 5
            ) {

                score +=
                    3;

                reasons.push(
                    `Refrigeration temperature ${temperature}°C is above the declared safe target.`
                );

            } else if (
                storage ===
                    "Hot holding" &&
                temperature < 60
            ) {

                score +=
                    3;

                reasons.push(
                    `Hot-holding temperature ${temperature}°C is below the declared target.`
                );

            } else {

                reasons.push(
                    `${storage} storage reduces immediate urgency based on declared data.`
                );
            }


            /* PACKAGING SCORE */

            if (
                packaging ===
                "Damaged"
            ) {

                score +=
                    3;

                reasons.push(
                    "Damaged packaging requires strict verification."
                );

            } else if (
                packaging ===
                "Open"
            ) {

                score +=
                    2;

                reasons.push(
                    "Open packaging increases contamination exposure."
                );

            } else if (
                packaging ===
                "Covered"
            ) {

                score +=
                    1;

                reasons.push(
                    "Covered packaging offers limited protection."
                );

            } else {

                reasons.push(
                    "Sealed packaging offers better protection."
                );
            }


            score =
                Math.min(
                    15,
                    Math.max(
                        1,
                        score
                    )
                );


            let riskLevel;

            if (score >= 10) {

                riskLevel =
                    "HIGH";

            } else if (
                score >= 6
            ) {

                riskLevel =
                    "MEDIUM";

            } else {

                riskLevel =
                    "LOW";
            }


            let rescueWindowMinutes;

            if (
                riskLevel ===
                "HIGH"
            ) {

                rescueWindowMinutes =
                    30;

            } else if (
                riskLevel ===
                "MEDIUM"
            ) {

                rescueWindowMinutes =
                    90;

            } else {

                rescueWindowMinutes =
                    180;
            }


            return {

                foodName:
                    foodName,

                foodType:
                    foodType,

                temperature:
                    temperature,

                hours:
                    hours,

                storage:
                    storage,

                packaging:
                    packaging,

                quantity:
                    quantity,

                score:
                    score,

                riskLevel:
                    riskLevel,

                rescueWindowMinutes:
                    rescueWindowMinutes,

                reasons:
                    reasons
            };
        }


        /* =============================================
           DISPLAY ANALYSIS
        ============================================= */

        function displayAnalysis(
            result
        ) {

            const reasonsHtml =
                result.reasons
                    .map(
                        reason => `
                            <li>
                                ${escapeHtml(reason)}
                            </li>
                        `
                    )
                    .join("");


            resultContent.innerHTML = `

                <div class="result-top">

                    <div>

                        <span class="mode-badge demo">
                            DEMO ANALYSIS
                        </span>

                        <h3>
                            ${escapeHtml(
                                result.foodName
                            )}
                        </h3>

                    </div>


                    <span
                        class="risk-badge
                        ${result.riskLevel.toLowerCase()}"
                    >

                        ${result.riskLevel}
                        URGENCY

                    </span>

                </div>


                <div class="decision-grid result-summary">

                    <div>

                        <strong>
                            ${result.rescueWindowMinutes}
                            min
                        </strong>

                        <span>
                            Rescue window
                        </span>

                    </div>


                    <div>

                        <strong>
                            ${result.quantity}
                        </strong>

                        <span>
                            Available portions
                        </span>

                    </div>


                    <div>

                        <strong>
                            ${result.score}/15
                        </strong>

                        <span>
                            Urgency score
                        </span>

                    </div>


                    <div>

                        <strong>
                            ${escapeHtml(
                                result.storage
                            )}
                        </strong>

                        <span>
                            Declared storage
                        </span>

                    </div>

                </div>


                <div class="result-block">

                    <h4>
                        Explainable Decision
                    </h4>

                    <ul class="result-list">
                        ${reasonsHtml}
                    </ul>

                    <p class="safety">

                        Demo result only. This result cannot
                        certify that food is safe.

                    </p>

                </div>
            `;


            emptyResult.classList.add(
                "hidden"
            );


            resultContent.classList.remove(
                "hidden"
            );


            displaySafetyGate();
        }


        /* =============================================
           HUMAN SAFETY GATE
        ============================================= */

        function displaySafetyGate() {

            networkPanel.classList.remove(
                "hidden"
            );


            publicAlert.classList.add(
                "hidden"
            );


            networkStatus.textContent =
                "Safety check required";


            networkStatus.className =
                "network-status warning";


            networkContent.innerHTML = `

                <div class="workflow-step active">

                    <span class="step-number">
                        1
                    </span>

                    <div>

                        <h4>
                            Mandatory Human Food-Safety Verification
                        </h4>

                        <p>

                            Check smell, texture, packaging,
                            contamination, storage records
                            and food handling before sending
                            any alert.

                        </p>

                    </div>

                </div>


                <div class="action-row">

                    <button
                        class="network-button approve"
                        data-action="safety-approve"
                    >
                        Safety Check Passed
                    </button>

                    <button
                        class="network-button reject"
                        data-action="safety-reject"
                    >
                        Reject Food
                    </button>

                </div>
            `;
        }


        /* =============================================
           NGO MATCH SCORE
        ============================================= */

        function calculateNgoScore(
            ngo,
            availablePortions
        ) {

            const distanceScore =
                Math.max(
                    0,
                    100 -
                    ngo.distance * 10
                );


            const usableCapacity =
                Math.min(
                    ngo.capacity,
                    ngo.mealsNeeded
                );


            const capacityScore =
                Math.min(
                    100,
                    (
                        usableCapacity /
                        availablePortions
                    ) * 100
                );


            return Math.round(

                ngo.needScore * 0.5 +

                distanceScore * 0.3 +

                capacityScore * 0.2
            );
        }


        /* =============================================
           PREPARE NGO QUEUE
        ============================================= */

        function prepareNgoQueue() {

            rescueState.ngos =
                ngoData
                    .map(
                        ngo => ({
                            ...ngo,

                            matchScore:
                                calculateNgoScore(
                                    ngo,
                                    rescueState.remaining
                                ),

                            declined:
                                false
                        })
                    )
                    .sort(
                        (
                            firstNgo,
                            secondNgo
                        ) =>
                            secondNgo.matchScore -
                            firstNgo.matchScore
                    );


            rescueState.ngoIndex =
                0;
        }


        /* =============================================
           FIND NEXT NGO
        ============================================= */

        function findNextNgo() {

            while (
                rescueState.ngoIndex <
                rescueState.ngos.length
            ) {

                const ngo =
                    rescueState.ngos[
                        rescueState.ngoIndex
                    ];


                if (
                    !ngo.declined &&
                    ngo.mealsNeeded > 0 &&
                    ngo.capacity > 0
                ) {

                    return ngo;
                }


                rescueState.ngoIndex +=
                    1;
            }


            return null;
        }


        /* =============================================
           DISPLAY NGO MATCH
        ============================================= */

        function displayNgoMatch() {

            const ngo =
                findNextNgo();


            if (!ngo) {

                issuePublicAlert();

                return;
            }


            rescueState.currentNgo =
                ngo;


            const maximumAccepted =
                Math.max(
                    1,
                    Math.min(
                        rescueState.remaining,
                        ngo.capacity,
                        ngo.mealsNeeded
                    )
                );


            networkStatus.textContent =
                "Best NGO found";


            networkStatus.className =
                "network-status online";


            networkContent.innerHTML = `

                <div class="progress-strip">

                    <span class="done">
                        Safety verified
                    </span>

                    <span class="active">
                        NGO matching
                    </span>

                    <span>
                        Pickup
                    </span>

                    <span>
                        Delivered
                    </span>

                </div>


                <article class="ngo-card">

                    <div class="ngo-top">

                        <div>

                            <span
                                class="need-badge
                                ${ngo.urgency.toLowerCase()}"
                            >
                                ${ngo.urgency}
                                NEED
                            </span>

                            <h4>
                                ${escapeHtml(
                                    ngo.name
                                )}
                            </h4>

                            <p>

                                ${escapeHtml(
                                    ngo.area
                                )}

                                •

                                ${ngo.distance}
                                km away

                            </p>

                        </div>


                        <strong class="match-score">

                            ${ngo.matchScore}%
                            match

                        </strong>

                    </div>


                    <div class="ngo-metrics">

                        <span>

                            <strong>
                                ${ngo.mealsNeeded}
                            </strong>

                            Meals needed

                        </span>


                        <span>

                            <strong>
                                ${ngo.capacity}
                            </strong>

                            Available capacity

                        </span>


                        <span>

                            <strong>
                                ${rescueState.remaining}
                            </strong>

                            Remaining stock

                        </span>

                    </div>


                    <label class="quantity-control">

                        Portions NGO can accept

                        <input
                            id="ngoAcceptQuantity"
                            type="number"
                            min="1"
                            max="${maximumAccepted}"
                            value="${maximumAccepted}"
                        >

                    </label>


                    <p class="match-reason">

                        Matching formula: need urgency 50%,
                        distance 30% and capacity 20%.

                    </p>

                </article>


                <div class="action-row">

                    <button
                        class="network-button approve"
                        data-action="ngo-accept"
                    >
                        Accept Quantity
                    </button>


                    <button
                        class="network-button reject"
                        data-action="ngo-decline"
                    >
                        NGO Has No Need
                    </button>

                </div>
            `;
        }


        /* =============================================
           DELIVERY PARTNER
        ============================================= */

        function displayDeliveryPartner(
            acceptedQuantity
        ) {

            const ngo =
                rescueState.currentNgo;


            rescueState.pendingAccepted =
                acceptedQuantity;


            rescueState.pickupOtp =
                String(
                    1000 +
                    Math.floor(
                        Math.random() *
                        9000
                    )
                );


            networkStatus.textContent =
                "Delivery assigned";


            networkStatus.className =
                "network-status online";


            networkContent.innerHTML = `

                <div class="progress-strip">

                    <span class="done">
                        Safety verified
                    </span>

                    <span class="done">
                        NGO accepted
                    </span>

                    <span class="active">
                        Pickup verification
                    </span>

                    <span>
                        Delivered
                    </span>

                </div>


                <div class="delivery-card">

                    <span class="delivery-icon">
                        DP
                    </span>

                    <div>

                        <p class="eyebrow">
                            DELIVERY PARTNER ASSIGNED
                        </p>

                        <h4>
                            ${escapeHtml(
                                ngo.deliveryPartner
                            )}
                        </h4>

                        <p>

                            Pickup:

                            ${acceptedQuantity}
                            portions

                            →

                            ${escapeHtml(
                                ngo.name
                            )}

                        </p>

                        <p>

                            Verification OTP:

                            <strong>
                                ${rescueState.pickupOtp}
                            </strong>

                        </p>

                    </div>

                </div>


                <p class="safety">

                    Delivery partner must verify packaging
                    and OTP before pickup.

                </p>


                <div class="action-row">

                    <button
                        class="network-button approve"
                        data-action="verify-pickup"
                    >
                        Verify OTP & Complete Delivery
                    </button>

                </div>
            `;
        }


        /* =============================================
           COMPLETE NGO DELIVERY
        ============================================= */

        function completeNgoDelivery() {

            const acceptedQuantity =
                rescueState.pendingAccepted;


            const ngo =
                rescueState.currentNgo;


            rescueState.remaining -=
                acceptedQuantity;


            rescueState.delivered +=
                acceptedQuantity;


            rescueState.allocations.push({

                destination:
                    ngo.name,

                portions:
                    acceptedQuantity,

                method:
                    "NGO delivery"
            });


            ngo.mealsNeeded -=
                acceptedQuantity;


            ngo.capacity -=
                acceptedQuantity;


            rescueState.ngoIndex +=
                1;


            if (
                rescueState.remaining > 0
            ) {

                showToast(
                    `${acceptedQuantity} portions delivered. Matching remaining ${rescueState.remaining}.`
                );


                displayNgoMatch();

            } else {

                displayCompletion();
            }
        }


        /* =============================================
           COUNTDOWN FORMAT
        ============================================= */

        function formatTime(
            totalSeconds
        ) {

            const minutes =
                Math.floor(
                    totalSeconds / 60
                );


            const seconds =
                totalSeconds % 60;


            return `${String(minutes).padStart(
                2,
                "0"
            )}:${String(seconds).padStart(
                2,
                "0"
            )}`;
        }


        /* =============================================
           PUBLIC ALERT COUNTDOWN
        ============================================= */

        function startCountdown() {

            clearInterval(
                countdownTimer
            );


            countdownTimer =
                setInterval(
                    () => {

                        rescueState.secondsLeft -=
                            1;


                        const countdownElement =
                            document.getElementById(
                                "publicCountdown"
                            );


                        if (
                            countdownElement
                        ) {

                            countdownElement.textContent =
                                formatTime(
                                    Math.max(
                                        0,
                                        rescueState.secondsLeft
                                    )
                                );
                        }


                        if (
                            rescueState.secondsLeft <=
                            0
                        ) {

                            clearInterval(
                                countdownTimer
                            );


                            networkStatus.textContent =
                                "Alert expired";


                            networkStatus.className =
                                "network-status danger";
                        }

                    },
                    1000
                );
        }


        /* =============================================
           VERIFIED PUBLIC SCREEN ALERT
        ============================================= */

        function issuePublicAlert() {

            rescueState.secondsLeft =

                rescueState
                    .result
                    .rescueWindowMinutes *

                60;


            networkStatus.textContent =
                "Public alert active";


            networkStatus.className =
                "network-status warning";


            publicAlert.classList.remove(
                "hidden"
            );


            publicAlertMessage.textContent =

                `${rescueState.remaining} verified portions are available near Patna. Alert displayed at Kankarbagh Community Screen and partner help desks.`;


            networkContent.innerHTML = `

                <div class="progress-strip">

                    <span class="done">
                        Safety verified
                    </span>

                    <span class="done">
                        NGOs checked
                    </span>

                    <span class="active">
                        Public alert
                    </span>

                    <span>
                        Community pickup
                    </span>

                </div>


                <div class="screen-card">

                    <p class="eyebrow">
                        PUBLIC DISPLAY PREVIEW
                    </p>

                    <h4>

                        ${escapeHtml(
                            rescueState.result.foodName
                        )}
                        available

                    </h4>


                    <strong>

                        ${rescueState.remaining}
                        portions

                    </strong>


                    <p>

                        Pickup point:
                        Kankarbagh Community Help Desk,
                        Patna

                    </p>


                    <p>

                        Verified rescue window:

                        <span id="publicCountdown">

                            ${formatTime(
                                rescueState.secondsLeft
                            )}

                        </span>

                    </p>


                    <p class="alert-rule">

                        Token-based pickup only.
                        No public alert is issued before
                        human food-safety verification.

                    </p>

                </div>


                <div class="action-row">

                    <button
                        class="network-button approve"
                        data-action="community-pickup"
                    >
                        Confirm Community Pickup
                    </button>

                </div>
            `;


            startCountdown();
        }


        /* =============================================
           COMPLETION AND IMPACT RECEIPT
        ============================================= */

        function displayCompletion() {

            clearInterval(
                countdownTimer
            );


            publicAlert.classList.add(
                "hidden"
            );


            networkStatus.textContent =
                "Rescue completed";


            networkStatus.className =
                "network-status online";


            const allocationRows =

                rescueState.allocations
                    .map(
                        allocation => `

                            <li>

                                <strong>

                                    ${escapeHtml(
                                        allocation.destination
                                    )}

                                </strong>

                                —

                                ${allocation.portions}
                                portions via

                                ${escapeHtml(
                                    allocation.method
                                )}

                            </li>
                        `
                    )
                    .join("");


            const estimatedWastePrevented =

                (
                    rescueState.delivered *
                    0.4
                ).toFixed(1);


            networkContent.innerHTML = `

                <div class="completion-card">

                    <span class="completion-mark">
                        ✓
                    </span>

                    <p class="eyebrow">
                        IMPACT RECEIPT
                    </p>

                    <h3>
                        Food Rescue Completed
                    </h3>


                    <div class="impact-receipt">

                        <div>

                            <strong>
                                ${rescueState.delivered}
                            </strong>

                            <span>
                                Meals rescued
                            </span>

                        </div>


                        <div>

                            <strong>

                                ${estimatedWastePrevented}
                                kg

                            </strong>

                            <span>
                                Waste prevented
                            </span>

                        </div>


                        <div>

                            <strong>
                                0
                            </strong>

                            <span>
                                Remaining stock
                            </span>

                        </div>

                    </div>


                    <ul class="allocation-list">

                        ${allocationRows}

                    </ul>


                    <p>

                        Audit trail:
                        safety verified →
                        need matched →
                        pickup verified →
                        delivery completed.

                    </p>

                </div>


                <button
                    class="network-button secondary-action"
                    data-action="reset"
                >
                    Start New Rescue
                </button>
            `;
        }


        /* =============================================
           NETWORK BUTTON ACTIONS
        ============================================= */

        networkPanel.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );


                if (
                    !button ||
                    !rescueState
                ) {

                    return;
                }


                const action =
                    button.dataset.action;


                /* SAFETY APPROVED */

                if (
                    action ===
                    "safety-approve"
                ) {

                    rescueState.safetyVerified =
                        true;


                    prepareNgoQueue();


                    displayNgoMatch();


                    showToast(
                        "Safety verified. NGO matching started."
                    );
                }


                /* SAFETY REJECTED */

                if (
                    action ===
                    "safety-reject"
                ) {

                    networkStatus.textContent =
                        "Food rejected";


                    networkStatus.className =
                        "network-status danger";


                    networkContent.innerHTML = `

                        <div class="closed-card">

                            <h4>
                                Listing Closed Safely
                            </h4>

                            <p>

                                The food was not released to
                                NGOs or public screens.
                                Unsafe distribution was
                                prevented.

                            </p>


                            <button
                                class="network-button secondary-action"
                                data-action="reset"
                            >
                                Start New Rescue
                            </button>

                        </div>
                    `;
                }


                /* NGO ACCEPTS QUANTITY */

                if (
                    action ===
                    "ngo-accept"
                ) {

                    const quantityInput =
                        document.getElementById(
                            "ngoAcceptQuantity"
                        );


                    const maximumQuantity =
                        Number(
                            quantityInput.max
                        );


                    const acceptedQuantity =
                        Math.floor(
                            Number(
                                quantityInput.value
                            )
                        );


                    if (
                        !Number.isFinite(
                            acceptedQuantity
                        ) ||
                        acceptedQuantity < 1 ||
                        acceptedQuantity >
                            maximumQuantity
                    ) {

                        showToast(
                            `Enter a quantity from 1 to ${maximumQuantity}.`
                        );

                        return;
                    }


                    displayDeliveryPartner(
                        acceptedQuantity
                    );
                }


                /* NGO DECLINES */

                if (
                    action ===
                    "ngo-decline"
                ) {

                    rescueState
                        .currentNgo
                        .declined =
                        true;


                    const declinedNgoName =
                        rescueState
                            .currentNgo
                            .name;


                    rescueState.ngoIndex +=
                        1;


                    showToast(
                        `${declinedNgoName} declined. Checking next NGO.`
                    );


                    displayNgoMatch();
                }


                /* DELIVERY VERIFIED */

                if (
                    action ===
                    "verify-pickup"
                ) {

                    completeNgoDelivery();
                }


                /* COMMUNITY PICKUP */

                if (
                    action ===
                    "community-pickup"
                ) {

                    const communityPortions =
                        rescueState.remaining;


                    rescueState.delivered +=
                        communityPortions;


                    rescueState.remaining =
                        0;


                    rescueState.allocations.push({

                        destination:
                            "Kankarbagh Community Help Desk",

                        portions:
                            communityPortions,

                        method:
                            "Verified public alert"
                    });


                    displayCompletion();
                }


                /* RESET DEMO */

                if (
                    action ===
                    "reset"
                ) {

                    clearInterval(
                        countdownTimer
                    );


                    foodForm.reset();


                    imagePreview.src =
                        "";


                    imagePreview.classList.add(
                        "hidden"
                    );


                    uploadBox.classList.remove(
                        "has-image"
                    );


                    fileLabel.textContent =
                        "JPG, PNG or WEBP • Maximum 5 MB";


                    resultContent.classList.add(
                        "hidden"
                    );


                    networkPanel.classList.add(
                        "hidden"
                    );


                    publicAlert.classList.add(
                        "hidden"
                    );


                    emptyResult.classList.remove(
                        "hidden"
                    );


                    rescueState =
                        null;


                    document
                        .getElementById(
                            "analyzer"
                        )
                        .scrollIntoView({
                            behavior:
                                "smooth"
                        });
                }
            }
        );


        /* =============================================
           START ANALYSIS
        ============================================= */

        foodForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                if (
                    !foodForm.reportValidity()
                ) {

                    return;
                }


                if (
                    !imageInput.files[0]
                ) {

                    showToast(
                        "Please upload a food photo."
                    );

                    return;
                }


                analyzeButton.disabled =
                    true;


                analyzeButton
                    .querySelector(
                        "span"
                    )
                    .textContent =
                    "Calculating rescue priority...";


                setTimeout(
                    () => {

                        const formData =
                            new FormData(
                                foodForm
                            );


                        const result =
                            analyzeFood(
                                formData
                            );


                        rescueState = {

                            result:
                                result,

                            remaining:
                                result.quantity,

                            delivered:
                                0,

                            allocations:
                                [],

                            safetyVerified:
                                false,

                            ngos:
                                [],

                            ngoIndex:
                                0,

                            currentNgo:
                                null
                        };


                        displayAnalysis(
                            result
                        );


                        analyzeButton.disabled =
                            false;


                        analyzeButton
                            .querySelector(
                                "span"
                            )
                            .textContent =
                            "Run Demo Analysis";


                        showToast(
                            "Analysis complete. Human safety verification is required."
                        );


                        networkPanel.scrollIntoView({
                            behavior:
                                "smooth",

                            block:
                                "nearest"
                        });

                    },
                    650
                );
            }
        );

    }
);