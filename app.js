document.addEventListener("DOMContentLoaded", () => {
    const runningLocally = [
        "localhost",
        "127.0.0.1"
    ].includes(window.location.hostname);

    const runningOnBackendPort = [
        "5000",
        "8080"
    ].includes(window.location.port);

    const API_BASE = runningLocally
        ? runningOnBackendPort
            ? ""
            : "http://localhost:5000"
        : "https://replate-ai-production.up.railway.app";


    /* ==================================================
       ELEMENTS
    ================================================== */

    const foodForm =
        document.getElementById("foodForm");

    const ngoOrderForm =
        document.getElementById("ngoOrderForm");

    const ngoFoodSelect =
        document.getElementById("ngoFoodSelect");

    const foodPhoto =
        document.getElementById("foodPhoto");

    const foodPreview =
        document.getElementById("foodPreview");

    const photoLabel =
        document.getElementById("photoLabel");

    const resetPhotoButton =
        document.getElementById("resetPhotoButton");

    const preparedAt =
        document.getElementById("preparedAt");

    const pickupDeadline =
        document.getElementById("pickupDeadline");

    const foodResult =
        document.getElementById("foodResult");

    const ngoOrderResult =
        document.getElementById("ngoOrderResult");

    const serverStatus =
        document.getElementById("serverStatus");

    const refreshButton =
        document.getElementById("refreshButton");

    const escalateButton =
        document.getElementById("escalateButton");

    const escalateFoodSelect =
        document.getElementById("escalateFoodSelect");

    const toast =
        document.getElementById("toast");

    let uploadedPhoto = "";


    /* ==================================================
       PAGE START
    ================================================== */

    setDefaultDates();
    checkServer();
    loadDashboard();

    window.setInterval(
        loadDashboard,
        5000
    );


    /* ==================================================
       EVENT LISTENERS
    ================================================== */

    if (foodPhoto) {
        foodPhoto.addEventListener(
            "change",
            handlePhotoUpload
        );
    }

    if (resetPhotoButton) {
        resetPhotoButton.addEventListener(
            "click",
            () => resetFoodPhoto(true)
        );
    }

    if (foodForm) {
        foodForm.addEventListener(
            "submit",
            submitFood
        );
    }

    if (ngoOrderForm) {
        ngoOrderForm.addEventListener(
            "submit",
            submitNgoOrder
        );
    }

    if (ngoFoodSelect) {
        ngoFoodSelect.addEventListener(
            "change",
            updateNgoMealLimit
        );
    }

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            loadDashboard
        );
    }

    if (escalateButton) {
        escalateButton.addEventListener(
            "click",
            escalateFoodAlert
        );
    }

    document.addEventListener(
        "click",
        (event) => {
            const button =
                event.target.closest(
                    ".delivery-complete-button"
                );

            if (!button) {
                return;
            }

            completeDelivery(
                button.dataset.deliveryId
            );
        }
    );


    /* ==================================================
       DEFAULT DATE AND TIME
    ================================================== */

    function setDefaultDates() {
        const currentTime =
            new Date();

        const preparationTime =
            new Date(
                currentTime.getTime() -
                60 * 60 * 1000
            );

        const deadlineTime =
            new Date(
                currentTime.getTime() +
                90 * 60 * 1000
            );

        if (preparedAt) {
            preparedAt.value =
                toLocalDateTime(
                    preparationTime
                );
        }

        if (pickupDeadline) {
            pickupDeadline.value =
                toLocalDateTime(
                    deadlineTime
                );
        }
    }


    function toLocalDateTime(date) {
        const offset =
            date.getTimezoneOffset();

        const localDate =
            new Date(
                date.getTime() -
                offset * 60 * 1000
            );

        return localDate
            .toISOString()
            .slice(0, 16);
    }


    /* ==================================================
       PHOTO UPLOAD AND PREVIEW
    ================================================== */

    function handlePhotoUpload(event) {
        const file =
            event.target.files[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            showToast(
                "Only JPG, PNG or WebP image is allowed.",
                "error"
            );

            resetFoodPhoto(false);
            return;
        }

        const maximumPhotoSize =
            10 * 1024 * 1024;

        if (file.size > maximumPhotoSize) {
            showToast(
                "Photo must be smaller than 10 MB.",
                "error"
            );

            resetFoodPhoto(false);
            return;
        }

        const reader =
            new FileReader();

        reader.onload = function () {
            uploadedPhoto =
                reader.result;

            if (foodPreview) {
                foodPreview.src =
                    uploadedPhoto;

                foodPreview.classList.remove(
                    "hidden"
                );

                foodPreview.style.display =
                    "block";

                foodPreview.style.width =
                    "100%";

                foodPreview.style.maxWidth =
                    "420px";

                foodPreview.style.height =
                    "240px";

                foodPreview.style.objectFit =
                    "cover";

                foodPreview.style.margin =
                    "16px auto 0";

                foodPreview.style.borderRadius =
                    "16px";
            }

            if (photoLabel) {
                photoLabel.textContent =
                    `${file.name} • Click to change`;
            }

            if (resetPhotoButton) {
                resetPhotoButton.style.display =
                    "inline-flex";
            }

            showToast(
                "Food photo selected successfully.",
                "success"
            );
        };

        reader.onerror = function () {
            showToast(
                "Photo could not be opened.",
                "error"
            );

            resetFoodPhoto(false);
        };

        reader.readAsDataURL(file);
    }


    /* ==================================================
       REMOVE SELECTED PHOTO
    ================================================== */

    function resetFoodPhoto(
        showMessage = true
    ) {
        uploadedPhoto = "";

        if (foodPhoto) {
            foodPhoto.value = "";
        }

        if (foodPreview) {
            foodPreview.src = "";
            foodPreview.removeAttribute("src");

            foodPreview.classList.add(
                "hidden"
            );

            foodPreview.style.display =
                "none";
        }

        if (photoLabel) {
            photoLabel.textContent =
                "Choose or capture a food photo";
        }

        if (resetPhotoButton) {
            resetPhotoButton.style.display =
                "none";
        }

        if (showMessage) {
            showToast(
                "Selected food photo removed.",
                "success"
            );
        }
    }


    /* ==================================================
       SERVER HEALTH
    ================================================== */

    async function checkServer() {
        try {
            const response =
                await fetch(
                    `${API_BASE}/api/health`,
                    {
                        cache: "no-store"
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "Server unavailable"
                );
            }

            const result =
                await readJsonResponse(
                    response
                );

            if (serverStatus) {
                serverStatus.textContent =
                    result.mode === "DEMO"
                        ? "Demo Server Online"
                        : "Server Online";

                serverStatus.classList.add(
                    "online"
                );

                serverStatus.classList.remove(
                    "offline"
                );
            }
        } catch (error) {
            if (serverStatus) {
                serverStatus.textContent =
                    "Server Offline";

                serverStatus.classList.remove(
                    "online"
                );

                serverStatus.classList.add(
                    "offline"
                );
            }

            showToast(
                runningLocally
                    ? "Backend offline. Run node server.js"
                    : "Online backend is unavailable.",
                "error"
            );
        }
    }


    /* ==================================================
       SUBMIT FOOD
    ================================================== */

    async function submitFood(event) {
        event.preventDefault();

        const safetyCheckboxes = [
            ...document.querySelectorAll(
                ".safety-checkbox"
            )
        ];

        const safetyApproved =
            safetyCheckboxes.length === 4 &&
            safetyCheckboxes.every(
                (checkbox) =>
                    checkbox.checked
            );

        if (!safetyApproved) {
            showResult(
                foodResult,
                "Complete all four mandatory safety checks.",
                "error"
            );

            return;
        }

        if (!uploadedPhoto) {
            showResult(
                foodResult,
                "Please select a food photo.",
                "error"
            );

            return;
        }

        const foodName =
            getInputValue("foodName");

        const quantity =
            Number(
                getInputValue(
                    "foodQuantity"
                )
            );

        const temperature =
            Number(
                getInputValue(
                    "temperature"
                )
            );

        if (!foodName) {
            showResult(
                foodResult,
                "Enter food name.",
                "error"
            );

            return;
        }

        if (
            !Number.isFinite(quantity) ||
            quantity < 1
        ) {
            showResult(
                foodResult,
                "Quantity must be at least 1 meal.",
                "error"
            );

            return;
        }

        if (!Number.isFinite(temperature)) {
            showResult(
                foodResult,
                "Enter current food temperature.",
                "error"
            );

            return;
        }

        if (
            !preparedAt ||
            !preparedAt.value
        ) {
            showResult(
                foodResult,
                "Enter preparation time.",
                "error"
            );

            return;
        }

        const preparedDate =
            new Date(
                preparedAt.value
            );

        if (
            Number.isNaN(
                preparedDate.getTime()
            )
        ) {
            showResult(
                foodResult,
                "Preparation time is invalid.",
                "error"
            );

            return;
        }

        const deadlineValue =
            pickupDeadline
                ? pickupDeadline.value
                : "";

        const deadlineDate =
            new Date(deadlineValue);

        if (
            Number.isNaN(
                deadlineDate.getTime()
            ) ||
            deadlineDate.getTime() <=
                Date.now()
        ) {
            showResult(
                foodResult,
                "Pickup deadline must be in the future.",
                "error"
            );

            return;
        }

        const hoursSincePreparation =
            Math.max(
                0,
                (
                    Date.now() -
                    preparedDate.getTime()
                ) /
                (1000 * 60 * 60)
            );

        const foodData = {
            restaurantName:
                getInputValue(
                    "restaurantName"
                ),

            restaurantPhone:
                getInputValue(
                    "restaurantPhone"
                ),

            foodCategory:
                getInputValue(
                    "foodCategory"
                ),

            foodName,
            quantity,

            preparedAt:
                preparedAt.value,

            hours:
                Number(
                    hoursSincePreparation
                        .toFixed(2)
                ),

            temperature,

            storage:
                getInputValue(
                    "storage"
                ),

            packaging:
                getInputValue(
                    "packaging"
                ),

            area:
                getInputValue(
                    "foodArea"
                ),

            exactLocation:
                getInputValue(
                    "exactLocation"
                ),

            pickupDeadline:
                deadlineValue,

            rescueWindow:
                Number(
                    getInputValue(
                        "rescueWindow"
                    )
                ),

            photo:
                uploadedPhoto,

            safetyApproved:
                true
        };

        const submitButton =
            foodForm.querySelector(
                'button[type="submit"]'
            );

        try {
            setButtonLoading(
                submitButton,
                true,
                "Running safety check..."
            );

            const response =
                await fetch(
                    `${API_BASE}/api/food`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                foodData
                            )
                    }
                );

            const result =
                await readJsonResponse(
                    response
                );

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Food submission failed."
                );
            }

            showResult(
                foodResult,
                result.message ||
                "Safe food added to stock.",
                "success"
            );

            showToast(
                `${foodName}: ${quantity} meals added to stock.`,
                "success"
            );

            resetFoodForm();
            await loadDashboard();

        } catch (error) {
            showResult(
                foodResult,
                error.message,
                "error"
            );

            showToast(
                error.message,
                "error"
            );

        } finally {
            setButtonLoading(
                submitButton,
                false
            );
        }
    }


    /* ==================================================
       NGO FOOD REQUEST
    ================================================== */

    async function submitNgoOrder(event) {
        event.preventDefault();

        const ngoId =
            getInputValue(
                "ngoSelect"
            );

        const foodId =
            getInputValue(
                "ngoFoodSelect"
            );

        const requiredMeals =
            Number(
                getInputValue(
                    "requiredMeals"
                )
            );

        if (!ngoId) {
            showResult(
                ngoOrderResult,
                "Select a verified NGO.",
                "error"
            );

            return;
        }

        if (!foodId) {
            showResult(
                ngoOrderResult,
                "Select the food required by the NGO.",
                "error"
            );

            return;
        }

        if (
            !Number.isFinite(
                requiredMeals
            ) ||
            requiredMeals < 1
        ) {
            showResult(
                ngoOrderResult,
                "Enter required meals.",
                "error"
            );

            return;
        }

        const submitButton =
            ngoOrderForm.querySelector(
                'button[type="submit"]'
            );

        try {
            setButtonLoading(
                submitButton,
                true,
                "AI matching..."
            );

            const response =
                await fetch(
                    `${API_BASE}/api/orders`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                ngoId,
                                foodId,
                                requiredMeals
                            })
                    }
                );

            const result =
                await readJsonResponse(
                    response
                );

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "NGO request failed."
                );
            }

            const order =
                result.order;

            const requestedFoodName =
                order.requestedFoodName ||
                "selected food";

            const message =
                Number(order.remainingNeed) > 0
                    ? `${order.allocatedMeals} meals of ${requestedFoodName} matched. ${order.remainingNeed} meals pending for the same food.`
                    : `${order.allocatedMeals} meals of ${requestedFoodName} completely matched.`;

            showResult(
                ngoOrderResult,
                message,
                "success"
            );

            showToast(
                "AI matching completed.",
                "success"
            );

            const requiredMealsInput =
                document.getElementById(
                    "requiredMeals"
                );

            if (requiredMealsInput) {
                requiredMealsInput.value =
                    "";
            }

            if (ngoFoodSelect) {
                ngoFoodSelect.value =
                    "";
            }

            await loadDashboard();

        } catch (error) {
            showResult(
                ngoOrderResult,
                error.message,
                "error"
            );

            showToast(
                error.message,
                "error"
            );

        } finally {
            setButtonLoading(
                submitButton,
                false
            );
        }
    }


    /* ==================================================
       PUBLIC ALERT ESCALATION
    ================================================== */

    async function escalateFoodAlert() {
        if (!escalateFoodSelect) {
            return;
        }

        const foodId =
            escalateFoodSelect.value;

        if (!foodId) {
            showToast(
                "Select food stock first.",
                "error"
            );

            return;
        }

        try {
            setButtonLoading(
                escalateButton,
                true,
                "Escalating..."
            );

            const response =
                await fetch(
                    `${API_BASE}/api/demo/escalate`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                foodId
                            })
                    }
                );

            const result =
                await readJsonResponse(
                    response
                );

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Escalation failed."
                );
            }

            showToast(
                result.message ||
                "Public alert issued.",
                "success"
            );

            await loadDashboard();

        } catch (error) {
            showToast(
                error.message,
                "error"
            );

        } finally {
            setButtonLoading(
                escalateButton,
                false
            );
        }
    }


    /* ==================================================
       DELIVERY VERIFICATION
    ================================================== */

    async function completeDelivery(
        deliveryId
    ) {
        const tokenInput =
            document.querySelector(
                `[data-token-for="${deliveryId}"]`
            );

        const pickupToken =
            tokenInput
                ? tokenInput.value.trim()
                : "";

        if (!pickupToken) {
            showToast(
                "Enter pickup OTP/token.",
                "error"
            );

            tokenInput?.focus();
            return;
        }

        try {
            const response =
                await fetch(
                    `${API_BASE}/api/delivery/complete`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                deliveryId,
                                pickupToken
                            })
                    }
                );

            const result =
                await readJsonResponse(
                    response
                );

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Verification failed."
                );
            }

            showToast(
                result.message ||
                "Delivery completed.",
                "success"
            );

            await loadDashboard();

        } catch (error) {
            showToast(
                error.message,
                "error"
            );
        }
    }


    /* ==================================================
       LOAD DASHBOARD
    ================================================== */

    async function loadDashboard() {
        try {
            const response =
                await fetch(
                    `${API_BASE}/api/dashboard`,
                    {
                        cache: "no-store"
                    }
                );

            const data =
                await readJsonResponse(
                    response
                );

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Dashboard data unavailable."
                );
            }

            renderMetrics(data);

            renderNgoOptions(
                data.ngos || []
            );

            renderNgoFoodOptions(
                data.foods || []
            );

            renderFoodList(
                data.foods || []
            );

            renderOrderList(
                data.orders || []
            );

            renderDeliveryList(
                data.deliveries || []
            );

            renderPublicAlerts(
                data.publicAlerts || []
            );

            renderNotifications(
                data.notifications || []
            );

            renderEscalationOptions(
                data.foods || []
            );

            if (serverStatus) {
                serverStatus.textContent =
                    "Demo Server Online";

                serverStatus.classList.add(
                    "online"
                );

                serverStatus.classList.remove(
                    "offline"
                );
            }

        } catch (error) {
            console.error(error);

            if (serverStatus) {
                serverStatus.textContent =
                    "Server Offline";

                serverStatus.classList.remove(
                    "online"
                );

                serverStatus.classList.add(
                    "offline"
                );
            }
        }
    }


    /* ==================================================
       METRICS
    ================================================== */

    function renderMetrics(data) {
        const availableMeals =
            (data.foods || []).reduce(
                (total, food) =>
                    total +
                    Number(
                        food.remainingQuantity || 0
                    ),
                0
            );

        const pendingNeed =
            (data.orders || []).reduce(
                (total, order) =>
                    total +
                    Number(
                        order.remainingNeed || 0
                    ),
                0
            );

        const activeDeliveries =
            (data.deliveries || []).filter(
                (delivery) =>
                    ![
                        "COMPLETED",
                        "DELIVERED"
                    ].includes(
                        delivery.status
                    )
            ).length;

        const publicAlerts =
            (data.publicAlerts || []).filter(
                (alert) =>
                    alert.status !==
                    "CLOSED"
            ).length;

        setText(
            "availableMeals",
            availableMeals
        );

        setText(
            "pendingNeed",
            pendingNeed
        );

        setText(
            "activeDeliveries",
            activeDeliveries
        );

        setText(
            "publicAlertCount",
            publicAlerts
        );
    }


    /* ==================================================
       NGO OPTIONS
    ================================================== */

    function renderNgoOptions(ngos) {
        const ngoSelect =
            document.getElementById(
                "ngoSelect"
            );

        if (!ngoSelect) {
            return;
        }

        const oldValue =
            ngoSelect.value;

        ngoSelect.innerHTML =
            '<option value="">Select verified NGO</option>';

        ngos.forEach((ngo) => {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                ngo.id;

            option.textContent =
                `${ngo.name} • Need ${Number(
                    ngo.currentNeed || 0
                )} meals • ${ngo.area}`;

            ngoSelect.appendChild(
                option
            );
        });

        restoreSelectValue(
            ngoSelect,
            oldValue
        );
    }


    /* ==================================================
       NGO FOOD OPTIONS
    ================================================== */

    function renderNgoFoodOptions(foods) {
        if (!ngoFoodSelect) {
            return;
        }

        const oldValue =
            ngoFoodSelect.value;

        ngoFoodSelect.innerHTML =
            '<option value="">Select required food</option>';

        const availableFoods =
            foods.filter(
                (food) =>
                    Number(
                        food.remainingQuantity
                    ) > 0 &&

                    food.safetyStatus ===
                        "APPROVED" &&

                    food.status ===
                        "AVAILABLE" &&

                    new Date(
                        food.pickupDeadline
                    ).getTime() >
                        Date.now()
            );

        if (!availableFoods.length) {
            const option =
                document.createElement(
                    "option"
                );

            option.value = "";
            option.disabled = true;

            option.textContent =
                "No verified food currently available";

            ngoFoodSelect.appendChild(
                option
            );

            ngoFoodSelect.disabled =
                true;

            updateNgoMealLimit();
            return;
        }

        ngoFoodSelect.disabled =
            false;

        availableFoods
            .sort(
                (
                    first,
                    second
                ) =>
                    new Date(
                        first.pickupDeadline
                    ) -
                    new Date(
                        second.pickupDeadline
                    )
            )
            .forEach((food) => {
                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    food.id;

                option.dataset.available =
                    String(
                        food.remainingQuantity
                    );

                option.textContent =
                    `${food.foodName} • ` +
                    `${food.remainingQuantity} meals • ` +
                    `${food.area}`;

                ngoFoodSelect.appendChild(
                    option
                );
            });

        restoreSelectValue(
            ngoFoodSelect,
            oldValue
        );

        updateNgoMealLimit();
    }


    function updateNgoMealLimit() {
        const requiredMealsInput =
            document.getElementById(
                "requiredMeals"
            );

        if (!requiredMealsInput) {
            return;
        }

        const selectedOption =
            ngoFoodSelect
                ? ngoFoodSelect.options[
                    ngoFoodSelect.selectedIndex
                ]
                : null;

        const available =
            Number(
                selectedOption
                    ?.dataset
                    .available || 0
            );

        if (available > 0) {
            requiredMealsInput.placeholder =
                `Available now: ${available}`;
        } else {
            requiredMealsInput.placeholder =
                "Select food first";
        }
    }


    /* ==================================================
       COMMUNITY ESCALATION OPTIONS
    ================================================== */

    function renderEscalationOptions(
        foods
    ) {
        if (!escalateFoodSelect) {
            return;
        }

        const oldValue =
            escalateFoodSelect.value;

        escalateFoodSelect.innerHTML =
            '<option value="">Select food stock</option>';

        foods
            .filter(
                (food) =>
                    Number(
                        food.remainingQuantity
                    ) > 0 &&

                    food.status ===
                        "AVAILABLE"
            )
            .forEach((food) => {
                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    food.id;

                option.textContent =
                    `${food.foodName} • ` +
                    `${food.remainingQuantity} meals`;

                escalateFoodSelect.appendChild(
                    option
                );
            });

        restoreSelectValue(
            escalateFoodSelect,
            oldValue
        );
    }


    /* ==================================================
       LIVE FOOD STOCK
    ================================================== */

    function renderFoodList(foods) {
        const foodList =
            document.getElementById(
                "foodList"
            );

        if (!foodList) {
            return;
        }

        if (!foods.length) {
            foodList.innerHTML = `
                <p class="empty-message">
                    No food stock added yet.
                </p>
            `;

            return;
        }

        foodList.innerHTML =
            foods.map((food) => {
                const quantity =
                    Number(
                        food.remainingQuantity || 0
                    );

                const available =
                    quantity > 0 &&
                    food.status !==
                        "CLOSED";

                return `
                    <article class="content-card">

                        <div class="content-card-heading">

                            <div>
                                <h3>
                                    ${escapeHtml(
                                        food.foodName
                                    )}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        food.area
                                    )}
                                </p>
                            </div>

                            <span class="${
                                available
                                    ? "status-badge"
                                    : "closed-badge"
                            }">

                                ${
                                    available
                                        ? escapeHtml(
                                            food.status
                                        )
                                        : "CLOSED"
                                }

                            </span>

                        </div>


                        <div class="detail-grid">

                            <p>
                                <strong>
                                    Food Name:
                                </strong>

                                ${escapeHtml(
                                    food.foodName
                                )}
                            </p>

                            <p>
                                <strong>
                                    Available:
                                </strong>

                                ${quantity} meals
                            </p>

                            <p>
                                <strong>
                                    Deadline:
                                </strong>

                                ${formatDate(
                                    food.pickupDeadline
                                )}
                            </p>

                        </div>

                    </article>
                `;
            }).join("");
    }


    /* ==================================================
       NGO ORDER LIST
    ================================================== */

    function renderOrderList(orders) {
        const orderList =
            document.getElementById(
                "orderList"
            );

        if (!orderList) {
            return;
        }

        if (!orders.length) {
            orderList.innerHTML = `
                <p class="empty-message">
                    No NGO request yet.
                </p>
            `;

            return;
        }

        orderList.innerHTML =
            orders.map((order) => {
                const pending =
                    Number(
                        order.remainingNeed
                    ) > 0;

                return `
                    <article class="content-card">

                        <div class="content-card-heading">

                            <div>

                                <h3>
                                    ${escapeHtml(
                                        order.ngoName
                                    )}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        order.area
                                    )}
                                </p>

                                <p>
                                    <strong>
                                        Food:
                                    </strong>

                                    ${escapeHtml(
                                        order.requestedFoodName ||
                                        "Any available food"
                                    )}
                                </p>

                            </div>


                            <span class="${
                                pending
                                    ? "warning-badge"
                                    : "status-badge"
                            }">

                                ${escapeHtml(
                                    order.status
                                )}

                            </span>

                        </div>


                        <div class="detail-grid">

                            <p>
                                <strong>
                                    Required:
                                </strong>

                                ${Number(
                                    order.requiredMeals || 0
                                )} meals
                            </p>

                            <p>
                                <strong>
                                    Matched:
                                </strong>

                                ${Number(
                                    order.allocatedMeals || 0
                                )} meals
                            </p>

                            <p>
                                <strong>
                                    Pending:
                                </strong>

                                ${Number(
                                    order.remainingNeed || 0
                                )} meals
                            </p>

                        </div>


                        <p class="card-note">

                            ${
                                pending
                                    ? "Remaining requirement will match with the same food from future hotel stock."
                                    : "Complete NGO requirement matched."
                            }

                        </p>

                    </article>
                `;
            }).join("");
    }


    /* ==================================================
       DELIVERY LIST
    ================================================== */

    function renderDeliveryList(
        deliveries
    ) {
        const deliveryList =
            document.getElementById(
                "deliveryList"
            );

        if (!deliveryList) {
            return;
        }

        if (!deliveries.length) {
            deliveryList.innerHTML = `
                <p class="empty-message dark-empty">
                    No delivery assigned yet.
                </p>
            `;

            return;
        }

        deliveryList.innerHTML =
            deliveries.map(
                (delivery) => {
                    const completed =
                        [
                            "COMPLETED",
                            "DELIVERED"
                        ].includes(
                            delivery.status
                        );

                    const deliveryAllocations =
                        delivery.allocations ||
                        [];

                    const allocations =
                        deliveryAllocations
                            .map(
                                (allocation) =>
                                    `${escapeHtml(
                                        allocation.foodName
                                    )}: ${
                                        Number(
                                            allocation.quantity ??
                                            allocation.meals ??
                                            0
                                        )
                                    } meals`
                            )
                            .join(", ");

                    const totalMeals =
                        deliveryAllocations.reduce(
                            (
                                total,
                                allocation
                            ) =>
                                total +
                                Number(
                                    allocation.quantity ??
                                    allocation.meals ??
                                    0
                                ),
                            0
                        );

                    return `
                        <article class="content-card delivery-card">

                            <div class="content-card-heading">

                                <div>

                                    <h3>
                                        ${escapeHtml(
                                            delivery.ngoName
                                        )}
                                    </h3>

                                    <p>
                                        ${escapeHtml(
                                            delivery.area
                                        )}
                                    </p>

                                </div>


                                <span class="${
                                    completed
                                        ? "closed-badge"
                                        : "status-badge"
                                }">

                                    ${escapeHtml(
                                        delivery.status
                                    )}

                                </span>

                            </div>


                            <p>
                                <strong>
                                    Food:
                                </strong>

                                ${allocations || "Pending"}
                            </p>

                            <p>
                                <strong>
                                    Total meals:
                                </strong>

                                ${totalMeals}
                            </p>

                            <p>
                                <strong>
                                    Delivery partner:
                                </strong>

                                ${escapeHtml(
                                    delivery.partner
                                )}
                            </p>

                            <p>
                                <strong>
                                    Pickup token:
                                </strong>

                                ${escapeHtml(
                                    delivery.pickupToken
                                )}
                            </p>


                            ${
                                completed
                                    ? `
                                        <p class="card-note">
                                            Pickup verified successfully.
                                        </p>
                                    `
                                    : `
                                        <div class="delivery-actions">

                                            <input
                                                type="text"
                                                class="pickup-token-input"
                                                data-token-for="${escapeHtml(
                                                    delivery.id
                                                )}"
                                                placeholder="Enter pickup OTP"
                                            >

                                            <button
                                                type="button"
                                                class="small-button delivery-complete-button"
                                                data-delivery-id="${escapeHtml(
                                                    delivery.id
                                                )}"
                                            >
                                                Verify Delivery
                                            </button>

                                        </div>
                                    `
                            }

                        </article>
                    `;
                }
            ).join("");
    }


    /* ==================================================
       PUBLIC ALERT LIST
    ================================================== */

    function renderPublicAlerts(
        alerts
    ) {
        const alertList =
            document.getElementById(
                "publicAlertList"
            );

        if (!alertList) {
            return;
        }

        if (!alerts.length) {
            alertList.innerHTML = `
                <p class="empty-message">
                    No community alert issued.
                </p>
            `;

            return;
        }

        alertList.innerHTML =
            alerts.map((alert) => `
                <article class="content-card">

                    <div class="content-card-heading">

                        <div>

                            <h3>
                                ${escapeHtml(
                                    alert.foodName
                                )}
                            </h3>

                            <p>
                                ${escapeHtml(
                                    alert.area
                                )}
                            </p>

                        </div>


                        <span class="${
                            alert.status ===
                                "CLOSED"
                                ? "closed-badge"
                                : "warning-badge"
                        }">

                            ${escapeHtml(
                                alert.status
                            )}

                        </span>

                    </div>


                    <p>
                        <strong>
                            Quantity:
                        </strong>

                        ${Number(
                            alert.quantity || 0
                        )} meals
                    </p>

                    <p>
                        <strong>
                            Pickup deadline:
                        </strong>

                        ${formatDate(
                            alert.pickupDeadline
                        )}
                    </p>

                    <p class="card-note">
                        Nearby beneficiaries notified through
                        public screen, app and SMS/IVR.
                    </p>

                </article>
            `).join("");
    }


    /* ==================================================
       NOTIFICATIONS
    ================================================== */

    function renderNotifications(
        notifications
    ) {
        const notificationList =
            document.getElementById(
                "notificationList"
            );

        if (!notificationList) {
            return;
        }

        if (!notifications.length) {
            notificationList.innerHTML = `
                <p class="empty-message">
                    No notifications yet.
                </p>
            `;

            return;
        }

        notificationList.innerHTML =
            notifications
                .slice(0, 12)
                .map(
                    (notification) => `
                        <article class="content-card">

                            <div class="content-card-heading">

                                <div>

                                    <h3>
                                        ${escapeHtml(
                                            notification.type ||
                                            "Update"
                                        )}
                                    </h3>

                                    <p>
                                        ${formatDate(
                                            notification.createdAt
                                        )}
                                    </p>

                                </div>


                                <span class="status-badge">

                                    ${escapeHtml(
                                        notification.channel ||
                                        "APP"
                                    )}

                                </span>

                            </div>


                            <p>
                                ${escapeHtml(
                                    notification.message
                                )}
                            </p>

                        </article>
                    `
                ).join("");
    }


    /* ==================================================
       RESPONSE READER
    ================================================== */

    async function readJsonResponse(
        response
    ) {
        const responseText =
            await response.text();

        if (!responseText) {
            return {};
        }

        try {
            return JSON.parse(
                responseText
            );

        } catch (error) {
            throw new Error(
                `Server returned invalid JSON (${response.status}).`
            );
        }
    }


    /* ==================================================
       RESET FOOD FORM
    ================================================== */

    function resetFoodForm() {
        if (foodForm) {
            foodForm.reset();
        }

        resetFoodPhoto(false);
        setDefaultDates();
    }


    /* ==================================================
       HELPER FUNCTIONS
    ================================================== */

    function getInputValue(id) {
        const element =
            document.getElementById(id);

        return element
            ? element.value.trim()
            : "";
    }


    function setText(id, value) {
        const element =
            document.getElementById(id);

        if (element) {
            element.textContent =
                value;
        }
    }


    function restoreSelectValue(
        select,
        oldValue
    ) {
        const valueExists = [
            ...select.options
        ].some(
            (option) =>
                option.value ===
                oldValue
        );

        if (valueExists) {
            select.value =
                oldValue;
        }
    }


    function setButtonLoading(
        button,
        loading,
        loadingText = "Please wait..."
    ) {
        if (!button) {
            return;
        }

        if (loading) {
            button.dataset.originalText =
                button.innerHTML;

            button.disabled =
                true;

            button.textContent =
                loadingText;

        } else {
            button.disabled =
                false;

            if (
                button.dataset.originalText
            ) {
                button.innerHTML =
                    button.dataset.originalText;
            }
        }
    }


    function showResult(
        element,
        message,
        type
    ) {
        if (!element) {
            return;
        }

        element.textContent =
            message;

        element.className =
            `form-result ${
                type === "success"
                    ? "success"
                    : "error"
            }`;
    }


    function showToast(
        message,
        type = "success"
    ) {
        if (!toast) {
            console.log(message);
            return;
        }

        toast.textContent =
            message;

        toast.className =
            `toast show ${type}`;

        window.clearTimeout(
            showToast.timeout
        );

        showToast.timeout =
            window.setTimeout(
                () => {
                    toast.className =
                        "toast";
                },
                3500
            );
    }


    function formatDate(value) {
        if (!value) {
            return "Not specified";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return String(value);
        }

        return date.toLocaleString(
            "en-IN"
        );
    }


    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );
    }
});
