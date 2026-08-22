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


    const foodChoices = [
        {
            value: "Prepared Meal",
            label: "Prepared Meal"
        },
        {
            value: "Rice",
            label: "Rice / Biryani"
        },
        {
            value: "Curry",
            label: "Dal / Curry"
        },
        {
            value: "Bread",
            label: "Bread / Roti"
        },
        {
            value: "Vegetables",
            label: "Vegetables / Sabzi"
        },
        {
            value: "Snacks",
            label: "Snacks"
        },
        {
            value: "Bakery",
            label: "Bakery Food"
        },
        {
            value: "Other",
            label: "Other Food"
        }
    ];


    /* =========================================
       ELEMENTS
    ========================================= */

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
        document.getElementById(
            "resetPhotoButton"
        );

    const preparedAt =
        document.getElementById("preparedAt");

    const pickupDeadline =
        document.getElementById(
            "pickupDeadline"
        );

    const foodResult =
        document.getElementById("foodResult");

    const ngoOrderResult =
        document.getElementById(
            "ngoOrderResult"
        );

    const serverStatus =
        document.getElementById(
            "serverStatus"
        );

    const refreshButton =
        document.getElementById(
            "refreshButton"
        );

    const escalateButton =
        document.getElementById(
            "escalateButton"
        );

    const escalateFoodSelect =
        document.getElementById(
            "escalateFoodSelect"
        );

    const toast =
        document.getElementById("toast");

    let uploadedPhoto = "";


    /* =========================================
       PAGE START
    ========================================= */

    setDefaultDates();
    checkServer();
    loadDashboard();

    window.setInterval(
        loadDashboard,
        5000
    );


    /* =========================================
       EVENT LISTENERS
    ========================================= */

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


    /* =========================================
       DEFAULT DATE AND TIME
    ========================================= */

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


    /* =========================================
       PHOTO UPLOAD
    ========================================= */

    function handlePhotoUpload(event) {
        const file =
            event.target.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            showToast(
                "Please select a valid image.",
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
                "Choose or capture food photo";
        }

        if (showMessage) {
            showToast(
                "Selected food photo removed.",
                "success"
            );
        }
    }


    /* =========================================
       SERVER HEALTH
    ========================================= */

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
                await response.json();

            if (serverStatus) {
                serverStatus.textContent =
                    result.mode === "DEMO"
                        ? "Demo Server Online"
                        : "Server Online";

                serverStatus.classList.add(
                    "online"
                );
            }
        } catch (error) {
            if (serverStatus) {
                serverStatus.textContent =
                    "Server Offline";

                serverStatus.classList.remove(
                    "online"
                );
            }

            showToast(
                "Backend is offline. Run node server.js",
                "error"
            );
        }
    }


    /* =========================================
       SUBMIT FOOD
    ========================================= */

    async function submitFood(event) {
        event.preventDefault();

        const safetyCheckboxes = [
            ...document.querySelectorAll(
                ".safety-checkbox"
            )
        ];

        const safetyApproved =
            safetyCheckboxes.length > 0 &&
            safetyCheckboxes.every(
                (checkbox) =>
                    checkbox.checked
            );

        if (!safetyApproved) {
            showResult(
                foodResult,
                "Complete all mandatory safety checks.",
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

        if (
            !pickupDeadline ||
            !pickupDeadline.value
        ) {
            showResult(
                foodResult,
                "Enter pickup deadline.",
                "error"
            );

            return;
        }

        const preparedDate =
            new Date(
                preparedAt.value
            );

        const deadlineDate =
            new Date(
                pickupDeadline.value
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

            temperature:
                Number(
                    getInputValue(
                        "temperature"
                    )
                ),

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
                pickupDeadline.value,

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
                await response.json();

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


    /* =========================================
       NGO FOOD REQUEST
    ========================================= */

    async function submitNgoOrder(event) {
        event.preventDefault();

        const ngoId =
            getInputValue("ngoSelect");

        const foodCategory =
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

        if (!foodCategory) {
            showResult(
                ngoOrderResult,
                "Select the food required by the NGO.",
                "error"
            );

            return;
        }

        if (
            !Number.isFinite(requiredMeals) ||
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
                                foodCategory,
                                requiredMeals
                            })
                    }
                );

            const result =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "NGO request failed."
                );
            }

            const order =
                result.order;

            const message =
                Number(
                    order.remainingNeed
                ) > 0
                    ? `${order.allocatedMeals} meals from ${order.requestedFoodName} matched. ${order.remainingNeed} meals are waiting for future stock.`
                    : `${order.allocatedMeals} meals from ${order.requestedFoodName} completely matched.`;

            showResult(
                ngoOrderResult,
                message,
                "success"
            );

            showToast(
                "NGO request saved successfully.",
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
                ngoFoodSelect.value = "";
            }

            updateNgoMealLimit();
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


    /* =========================================
       PUBLIC ALERT
    ========================================= */

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
                await response.json();

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


    /* =========================================
       DELIVERY VERIFICATION
    ========================================= */

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
                await response.json();

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


    /* =========================================
       LOAD DASHBOARD
    ========================================= */

    async function loadDashboard() {
        try {
            const response =
                await fetch(
                    `${API_BASE}/api/dashboard`,
                    {
                        cache: "no-store"
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "Dashboard data unavailable."
                );
            }

            const data =
                await response.json();

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
            }
        } catch (error) {
            console.error(error);

            if (serverStatus) {
                serverStatus.textContent =
                    "Server Offline";

                serverStatus.classList.remove(
                    "online"
                );
            }
        }
    }


    /* =========================================
       METRICS
    ========================================= */

    function renderMetrics(data) {
        const availableMeals =
            (data.foods || []).reduce(
                (total, food) =>
                    total +
                    Number(
                        food.remainingQuantity ||
                        0
                    ),
                0
            );

        const pendingNeed =
            (data.orders || []).reduce(
                (total, order) =>
                    total +
                    Number(
                        order.remainingNeed ||
                        0
                    ),
                0
            );

        const activeDeliveries =
            (data.deliveries || []).filter(
                (delivery) =>
                    delivery.status !==
                    "COMPLETED"
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


    /* =========================================
       NGO OPTIONS
    ========================================= */

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
                `${ngo.name} • Need ${ngo.currentNeed || 0} meals • ${ngo.area}`;

            ngoSelect.appendChild(
                option
            );
        });

        const valueExists = [
            ...ngoSelect.options
        ].some(
            (option) =>
                option.value === oldValue
        );

        if (valueExists) {
            ngoSelect.value =
                oldValue;
        }
    }


    /* =========================================
       NGO FOOD OPTIONS
    ========================================= */

    function renderNgoFoodOptions(foods) {
        if (!ngoFoodSelect) {
            return;
        }

        const oldValue =
            ngoFoodSelect.value;

        const availableByCategory = {};

        foods
            .filter(
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
            )
            .forEach((food) => {
                const category =
                    food.foodCategory ||
                    "Other";

                availableByCategory[
                    category
                ] =
                    Number(
                        availableByCategory[
                            category
                        ] || 0
                    ) +
                    Number(
                        food.remainingQuantity ||
                        0
                    );
            });

        ngoFoodSelect.innerHTML =
            '<option value="">Select required food</option>';

        foodChoices.forEach(
            (choice) => {
                const option =
                    document.createElement(
                        "option"
                    );

                const available =
                    Number(
                        availableByCategory[
                            choice.value
                        ] || 0
                    );

                option.value =
                    choice.value;

                option.dataset.available =
                    String(available);

                option.textContent =
                    available > 0
                        ? `${choice.label} • ${available} meals available`
                        : `${choice.label} • Request for future stock`;

                ngoFoodSelect.appendChild(
                    option
                );
            }
        );

        ngoFoodSelect.disabled =
            false;

        const valueExists = [
            ...ngoFoodSelect.options
        ].some(
            (option) =>
                option.value === oldValue
        );

        if (valueExists) {
            ngoFoodSelect.value =
                oldValue;
        }

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
                    ?.available || 0
            );

        if (available > 0) {
            requiredMealsInput.placeholder =
                `Available now: ${available}`;
        } else if (
            ngoFoodSelect &&
            ngoFoodSelect.value
        ) {
            requiredMealsInput.placeholder =
                "No stock now — request will stay pending";
        } else {
            requiredMealsInput.placeholder =
                "Select food first";
        }
    }


    /* =========================================
       ESCALATION OPTIONS
    ========================================= */

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
                    food.status !== "CLOSED"
            )
            .forEach((food) => {
                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    food.id;

                option.textContent =
                    `${food.foodName} • ${food.remainingQuantity} meals`;

                escalateFoodSelect.appendChild(
                    option
                );
            });

        const valueExists = [
            ...escalateFoodSelect.options
        ].some(
            (option) =>
                option.value === oldValue
        );

        if (valueExists) {
            escalateFoodSelect.value =
                oldValue;
        }
    }


    /* =========================================
       LIVE STOCK
    ========================================= */

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
            foods
                .map((food) => {
                    const quantity =
                        Number(
                            food.remainingQuantity ||
                            0
                        );

                    const available =
                        quantity > 0;

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
                                            food.foodCategory ||
                                            "Food"
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
                                            ? "AVAILABLE"
                                            : "CLOSED"
                                    }
                                </span>
                            </div>

                            <div class="detail-grid">
                                <p>
                                    <strong>Food:</strong>
                                    ${escapeHtml(
                                        food.foodName
                                    )}
                                </p>

                                <p>
                                    <strong>Quantity:</strong>
                                    ${quantity} meals
                                </p>
                            </div>
                        </article>
                    `;
                })
                .join("");
    }


    /* =========================================
       NGO ORDERS
    ========================================= */

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
            orders
                .map((order) => {
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
                                        <strong>Food:</strong>
                                        ${escapeHtml(
                                            order.requestedFoodName ||
                                            order.requestedFoodCategory ||
                                            "Food"
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
                                    <strong>Required:</strong>
                                    ${order.requiredMeals} meals
                                </p>

                                <p>
                                    <strong>Matched:</strong>
                                    ${order.allocatedMeals} meals
                                </p>

                                <p>
                                    <strong>Pending:</strong>
                                    ${order.remainingNeed} meals
                                </p>
                            </div>

                            <p class="card-note">
                                ${
                                    pending
                                        ? "Remaining meals will match automatically with future stock from the selected category."
                                        : "Complete NGO requirement matched."
                                }
                            </p>
                        </article>
                    `;
                })
                .join("");
    }


    /* =========================================
       DELIVERIES
    ========================================= */

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
            deliveries
                .map((delivery) => {
                    const completed =
                        delivery.status ===
                            "COMPLETED" ||
                        delivery.status ===
                            "DELIVERED";

                    const allocations =
                        (
                            delivery.allocations ||
                            []
                        )
                            .map(
                                (allocation) =>
                                    `${escapeHtml(
                                        allocation.foodName
                                    )}: ${
                                        allocation.quantity ??
                                        allocation.meals ??
                                        0
                                    } meals`
                            )
                            .join(", ");

                    const totalMeals =
                        (
                            delivery.allocations ||
                            []
                        ).reduce(
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
                                <strong>Food:</strong>
                                ${allocations || "Pending"}
                            </p>

                            <p>
                                <strong>Total meals:</strong>
                                ${totalMeals}
                            </p>

                            <p>
                                <strong>Delivery partner:</strong>
                                ${escapeHtml(
                                    delivery.partner ||
                                    "Volunteer"
                                )}
                            </p>

                            <p>
                                <strong>Pickup token:</strong>
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
                                                data-token-for="${delivery.id}"
                                                placeholder="Enter pickup OTP"
                                            >

                                            <button
                                                type="button"
                                                class="small-button delivery-complete-button"
                                                data-delivery-id="${delivery.id}"
                                            >
                                                Verify Delivery
                                            </button>
                                        </div>
                                    `
                            }
                        </article>
                    `;
                })
                .join("");
    }


    /* =========================================
       PUBLIC ALERTS
    ========================================= */

    function renderPublicAlerts(alerts) {
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
                    No public alert issued.
                </p>
            `;

            return;
        }

        alertList.innerHTML =
            alerts
                .map((alert) => `
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
                            <strong>Quantity:</strong>
                            ${alert.quantity} meals
                        </p>

                        <p>
                            <strong>Pickup deadline:</strong>
                            ${formatDate(
                                alert.pickupDeadline
                            )}
                        </p>

                        <p class="card-note">
                            Nearby beneficiaries notified through
                            public screen, app and SMS/IVR.
                        </p>
                    </article>
                `)
                .join("");
    }


    /* =========================================
       NOTIFICATIONS
    ========================================= */

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
                .map((notification) => `
                    <article class="content-card">
                        <div class="content-card-heading">
                            <div>
                                <h3>
                                    ${escapeHtml(
                                        notification.channel
                                    )}
                                    Notification
                                </h3>

                                <p>
                                    ${formatDate(
                                        notification.createdAt
                                    )}
                                </p>
                            </div>

                            <span class="status-badge">
                                ${escapeHtml(
                                    notification.status ||
                                    "SENT"
                                )}
                            </span>
                        </div>

                        <p>
                            ${escapeHtml(
                                notification.message
                            )}
                        </p>
                    </article>
                `)
                .join("");
    }


    /* =========================================
       RESET FORM
    ========================================= */

    function resetFoodForm() {
        if (foodForm) {
            foodForm.reset();
        }

        resetFoodPhoto(false);
        setDefaultDates();
    }


    /* =========================================
       HELPERS
    ========================================= */

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

            button.disabled = true;

            button.textContent =
                loadingText;
        } else {
            button.disabled = false;

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
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
});