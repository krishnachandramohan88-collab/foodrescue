const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 5000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

const NGO_RESPONSE_TIME = 10 * 60 * 1000;
const MAX_REQUEST_SIZE = 20 * 1024 * 1024;

const CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon"
};

const ngoDirectory = [
    {
        id: "NGO-1",
        name: "Helping Hands",
        area: "Kankarbagh",
        distanceKm: 2.4,
        needScore: 95,
        capacity: 120
    },
    {
        id: "NGO-2",
        name: "Food For All Kitchen",
        area: "Rajendra Nagar",
        distanceKm: 4.1,
        needScore: 78,
        capacity: 80
    },
    {
        id: "NGO-3",
        name: "Hope Community",
        area: "Patliputra",
        distanceKm: 6.8,
        needScore: 55,
        capacity: 60
    }
];

const deliveryPartners = [
    "Amit Kumar",
    "Neha Singh",
    "Rahul Verma"
];


/* =========================================
   DATABASE
========================================= */

function createEmptyDatabase() {
    return {
        foods: [],
        orders: [],
        notifications: [],
        deliveries: [],
        publicAlerts: []
    };
}

function loadDatabase() {
    try {
        const saved = JSON.parse(
            fs.readFileSync(STORE_FILE, "utf8")
        );

        const empty = createEmptyDatabase();

        for (const key of Object.keys(empty)) {
            empty[key] = Array.isArray(saved[key])
                ? saved[key]
                : [];
        }

        return empty;
    } catch (error) {
        return createEmptyDatabase();
    }
}

let database = loadDatabase();

function saveDatabase() {
    fs.mkdirSync(DATA_DIR, {
        recursive: true
    });

    fs.writeFileSync(
        STORE_FILE,
        JSON.stringify(database, null, 2)
    );
}


/* =========================================
   HELPERS
========================================= */

function createId(prefix) {
    const randomPart = crypto
        .randomBytes(2)
        .toString("hex")
        .toUpperCase();

    return `${prefix}-${Date.now()}-${randomPart}`;
}

function createToken() {
    return crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase();
}

function normalizeFoodName(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function sendJSON(response, statusCode, data) {
    response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
            "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":
            "Content-Type"
    });

    response.end(JSON.stringify(data));
}

function readBody(request) {
    return new Promise((resolve, reject) => {
        const chunks = [];

        let totalSize = 0;
        let finished = false;

        request.on("data", (chunk) => {
            if (finished) {
                return;
            }

            totalSize += chunk.length;

            if (totalSize > MAX_REQUEST_SIZE) {
                finished = true;

                const error = new Error(
                    "Request is too large. Photo must be below 10 MB."
                );

                error.statusCode = 413;

                reject(error);
                return;
            }

            chunks.push(chunk);
        });

        request.on("end", () => {
            if (finished) {
                return;
            }

            try {
                const body = Buffer
                    .concat(chunks)
                    .toString("utf8");

                resolve(
                    body
                        ? JSON.parse(body)
                        : {}
                );
            } catch (error) {
                const invalidJsonError =
                    new Error(
                        "Invalid JSON request."
                    );

                invalidJsonError.statusCode = 400;

                reject(invalidJsonError);
            }
        });

        request.on("error", reject);
    });
}

function addNotification(
    type,
    receiver,
    message,
    channel = "APP"
) {
    database.notifications.unshift({
        id: createId("NOTIFICATION"),
        type,
        receiver,
        message,
        channel,
        status: "SIMULATED_SENT",
        createdAt: new Date().toISOString()
    });

    database.notifications =
        database.notifications.slice(0, 100);
}


/* =========================================
   FOOD RISK CHECK
========================================= */

function calculateRisk(data) {
    let score = 0;

    const reasons = [];
    const hours = Number(data.hours) || 0;
    const temperature =
        Number(data.temperature) || 0;

    if (hours >= 6) {
        score += 5;
        reasons.push("Long holding time");
    } else if (hours >= 3) {
        score += 3;
        reasons.push("Prompt rescue required");
    }

    if (data.storage === "Room temperature") {
        score += 4;
        reasons.push(
            "Room-temperature storage"
        );
    }

    if (
        data.storage === "Refrigerated" &&
        temperature > 5
    ) {
        score += 3;
        reasons.push(
            "Refrigeration above target"
        );
    }

    if (data.packaging === "Open") {
        score += 2;
        reasons.push("Open packaging");
    }

    return {
        score,
        urgency:
            score >= 8
                ? "HIGH"
                : score >= 4
                    ? "MEDIUM"
                    : "LOW",
        reasons
    };
}


/* =========================================
   DELIVERY
========================================= */

function createDelivery(order, allocations) {
    const partner =
        deliveryPartners[
            database.deliveries.length %
            deliveryPartners.length
        ];

    const totalMeals = allocations.reduce(
        (total, allocation) =>
            total + allocation.quantity,
        0
    );

    const delivery = {
        id: createId("DELIVERY"),
        orderId: order.id,
        ngoName: order.ngoName,
        area: order.area,
        partner,
        allocations,
        pickupToken: createToken(),
        status: "PARTNER_NOTIFIED",
        createdAt: new Date().toISOString()
    };

    database.deliveries.unshift(delivery);

    addNotification(
        "DELIVERY",
        partner,
        `Pickup ${totalMeals} meals for ${order.ngoName}.`
    );

    return delivery;
}


/* =========================================
   NGO ORDER MATCHING
========================================= */

function matchOrder(order) {
    let required =
        Number(order.remainingNeed) || 0;

    const allocations = [];

    const requestedFoodName =
        normalizeFoodName(
            order.requestedFoodName
        );

    const availableFoods =
        database.foods
            .filter((food) =>
                food.safetyStatus === "APPROVED" &&
                food.status === "AVAILABLE" &&
                Number(food.remainingQuantity) > 0 &&
                (
                    !requestedFoodName ||
                    normalizeFoodName(
                        food.foodName
                    ) === requestedFoodName
                ) &&
                new Date(
                    food.pickupDeadline
                ).getTime() > Date.now()
            )
            .sort((first, second) => {
                if (
                    first.id ===
                        order.requestedFoodId &&
                    second.id !==
                        order.requestedFoodId
                ) {
                    return -1;
                }

                if (
                    second.id ===
                        order.requestedFoodId &&
                    first.id !==
                        order.requestedFoodId
                ) {
                    return 1;
                }

                return (
                    new Date(
                        first.pickupDeadline
                    ) -
                    new Date(
                        second.pickupDeadline
                    )
                );
            });

    for (const food of availableFoods) {
        if (required <= 0) {
            break;
        }

        const allocated = Math.min(
            required,
            Number(food.remainingQuantity)
        );

        food.remainingQuantity -= allocated;

        food.reservedQuantity =
            Number(food.reservedQuantity || 0) +
            allocated;

        required -= allocated;

        if (food.remainingQuantity === 0) {
            food.status = "FULLY_RESERVED";
        }

        allocations.push({
            foodId: food.id,
            restaurantName:
                food.restaurantName,
            foodName: food.foodName,
            exactLocation:
                food.exactLocation,
            quantity: allocated
        });
    }

    const matched =
        Number(order.remainingNeed) -
        required;

    order.allocatedMeals =
        Number(order.allocatedMeals || 0) +
        matched;

    order.remainingNeed = required;

    if (required === 0) {
        order.status = "FULLY_MATCHED";
    } else if (order.allocatedMeals > 0) {
        order.status = "PARTIALLY_MATCHED";
    } else {
        order.status = "WAITING_FOR_STOCK";
    }

    if (allocations.length > 0) {
        createDelivery(order, allocations);
    }

    return allocations;
}


/* =========================================
   MATCH NEW FOOD WITH PENDING ORDERS
========================================= */

function matchNewFood(food) {
    const pendingOrders =
        database.orders
            .filter((order) =>
                Number(order.remainingNeed) > 0 &&
                (
                    !order.requestedFoodName ||
                    normalizeFoodName(
                        order.requestedFoodName
                    ) ===
                    normalizeFoodName(
                        food.foodName
                    )
                )
            )
            .sort((first, second) =>
                Number(second.needScore) -
                    Number(first.needScore) ||
                new Date(first.createdAt) -
                    new Date(second.createdAt)
            );

    const matches = [];

    for (const order of pendingOrders) {
        if (food.remainingQuantity <= 0) {
            break;
        }

        const before =
            Number(order.allocatedMeals);

        const allocations =
            matchOrder(order);

        if (
            order.allocatedMeals > before
        ) {
            matches.push({
                orderId: order.id,
                ngoName: order.ngoName,
                allocations
            });
        }
    }

    if (food.remainingQuantity > 0) {
        food.alertStage = "NGO";

        food.ngoAlertDeadline =
            new Date(
                Date.now() +
                NGO_RESPONSE_TIME
            ).toISOString();

        const nearbyNGOs =
            [...ngoDirectory].sort(
                (first, second) =>
                    second.needScore -
                        first.needScore ||
                    first.distanceKm -
                        second.distanceKm
            );

        for (const ngo of nearbyNGOs) {
            addNotification(
                "FOOD_ALERT",
                ngo.name,
                `${food.remainingQuantity} meals of ${food.foodName} available near ${food.area}.`
            );
        }
    }

    return matches;
}


/* =========================================
   PUBLIC ALERT
========================================= */

function checkExpiredAlerts() {
    let changed = false;

    for (const food of database.foods) {
        const alertExpired =
            food.alertStage === "NGO" &&
            Number(
                food.remainingQuantity
            ) > 0 &&
            food.ngoAlertDeadline &&
            Date.now() >=
                new Date(
                    food.ngoAlertDeadline
                ).getTime();

        if (!alertExpired) {
            continue;
        }

        food.alertStage = "PUBLIC";
        food.status = "PUBLIC_ALERT";

        const alreadyExists =
            database.publicAlerts.some(
                (alert) =>
                    alert.foodId === food.id &&
                    alert.status === "ACTIVE"
            );

        if (!alreadyExists) {
            const publicAlert = {
                id: createId("PUBLIC"),
                foodId: food.id,
                foodName: food.foodName,
                quantity:
                    food.remainingQuantity,
                area: food.area,
                pickupDeadline:
                    food.pickupDeadline,
                status: "ACTIVE",
                createdAt:
                    new Date().toISOString()
            };

            database.publicAlerts.unshift(
                publicAlert
            );

            addNotification(
                "PUBLIC_SCREEN",
                "Community Screen",
                `${publicAlert.quantity} verified meals available near ${publicAlert.area}.`,
                "SCREEN"
            );
        }

        changed = true;
    }

    if (changed) {
        saveDatabase();
    }
}


/* =========================================
   STATIC FILES
========================================= */

function serveFile(response, filePath) {
    fs.readFile(
        filePath,
        (error, fileData) => {
            if (error) {
                response.writeHead(404, {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                });

                response.end(
                    "Page not found"
                );

                return;
            }

            const extension =
                path
                    .extname(filePath)
                    .toLowerCase();

            response.writeHead(200, {
                "Content-Type":
                    CONTENT_TYPES[extension] ||
                    "application/octet-stream",
                "Cache-Control":
                    "no-store"
            });

            response.end(fileData);
        }
    );
}

setInterval(
    checkExpiredAlerts,
    5000
);


/* =========================================
   SERVER
========================================= */

const server = http.createServer(
    async (request, response) => {
        try {
            const url = new URL(
                request.url,
                "http://localhost"
            );

            const pathname =
                decodeURIComponent(
                    url.pathname
                );

            if (
                request.method === "OPTIONS"
            ) {
                response.writeHead(204, {
                    "Access-Control-Allow-Origin":
                        "*",
                    "Access-Control-Allow-Methods":
                        "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers":
                        "Content-Type",
                    "Access-Control-Max-Age":
                        "86400"
                });

                response.end();
                return;
            }


            /* HEALTH API */

            if (
                pathname === "/api/health" &&
                request.method === "GET"
            ) {
                sendJSON(response, 200, {
                    success: true,
                    name: "RePlate AI",
                    mode: "DEMO",
                    message:
                        "RePlate AI backend is working."
                });

                return;
            }


            /* DASHBOARD API */

            if (
                pathname ===
                    "/api/dashboard" &&
                request.method === "GET"
            ) {
                checkExpiredAlerts();

                const ngos =
                    ngoDirectory.map(
                        (ngo) => ({
                            ...ngo,

                            currentNeed:
                                database.orders
                                    .filter(
                                        (order) =>
                                            order.ngoId ===
                                            ngo.id
                                    )
                                    .reduce(
                                        (
                                            total,
                                            order
                                        ) =>
                                            total +
                                            Number(
                                                order.remainingNeed ||
                                                0
                                            ),
                                        0
                                    )
                        })
                    );

                sendJSON(response, 200, {
                    success: true,
                    foods: database.foods,
                    orders: database.orders,
                    notifications:
                        database.notifications,
                    deliveries:
                        database.deliveries,
                    publicAlerts:
                        database.publicAlerts,
                    ngos
                });

                return;
            }


            /* ADD FOOD API */

            if (
                pathname === "/api/food" &&
                request.method === "POST"
            ) {
                const data =
                    await readBody(request);

                const quantity =
                    Math.floor(
                        Number(data.quantity)
                    );

                if (
                    data.safetyApproved !== true
                ) {
                    sendJSON(response, 403, {
                        success: false,
                        message:
                            "Safety approval is required."
                    });

                    return;
                }

                if (
                    data.packaging === "Damaged"
                ) {
                    sendJSON(response, 403, {
                        success: false,
                        message:
                            "Damaged packaging was rejected."
                    });

                    return;
                }

                if (
                    !Number.isFinite(quantity) ||
                    quantity < 1
                ) {
                    sendJSON(response, 400, {
                        success: false,
                        message:
                            "Enter a valid quantity."
                    });

                    return;
                }

                const food = {
                    id: createId("FOOD"),

                    restaurantName:
                        data.restaurantName ||
                        "Restaurant",

                    restaurantPhone:
                        data.restaurantPhone ||
                        "",

                    teamMember:
                        data.teamMember ||
                        "Staff",

                    foodCategory:
                        data.foodCategory ||
                        "Prepared meal",

                    foodName:
                        data.foodName ||
                        "Prepared food",

                    totalQuantity:
                        quantity,

                    reservedQuantity:
                        0,

                    remainingQuantity:
                        quantity,

                    area:
                        data.area ||
                        "Patna",

                    exactLocation:
                        data.exactLocation ||
                        "Restaurant counter",

                    photo:
                        data.photo || "",

                    preparedAt:
                        data.preparedAt,

                    hours:
                        Number(data.hours) || 0,

                    temperature:
                        Number(
                            data.temperature
                        ),

                    storage:
                        data.storage,

                    packaging:
                        data.packaging,

                    rescueWindow:
                        Number(
                            data.rescueWindow
                        ) || 90,

                    pickupDeadline:
                        data.pickupDeadline ||
                        new Date(
                            Date.now() +
                            90 * 60 * 1000
                        ).toISOString(),

                    safetyStatus:
                        "APPROVED",

                    risk:
                        calculateRisk(data),

                    status:
                        "AVAILABLE",

                    alertStage:
                        "MATCHING",

                    createdAt:
                        new Date().toISOString()
                };

                database.foods.unshift(food);

                const matches =
                    matchNewFood(food);

                saveDatabase();

                sendJSON(response, 201, {
                    success: true,
                    message:
                        "Verified food added and matching completed.",
                    food,
                    matches
                });

                return;
            }


            /* NGO ORDER API */

            if (
                pathname === "/api/orders" &&
                request.method === "POST"
            ) {
                const data =
                    await readBody(request);

                const requiredMeals =
                    Math.floor(
                        Number(
                            data.requiredMeals
                        )
                    );

                const ngo =
                    ngoDirectory.find(
                        (item) =>
                            item.id ===
                            data.ngoId
                    );

                const selectedFood =
                    database.foods.find(
                        (item) =>
                            item.id ===
                                data.foodId &&
                            item.safetyStatus ===
                                "APPROVED" &&
                            item.status ===
                                "AVAILABLE" &&
                            Number(
                                item.remainingQuantity
                            ) > 0 &&
                            new Date(
                                item.pickupDeadline
                            ).getTime() >
                                Date.now()
                    );

                if (
                    !ngo ||
                    !selectedFood ||
                    !Number.isFinite(
                        requiredMeals
                    ) ||
                    requiredMeals < 1
                ) {
                    sendJSON(response, 400, {
                        success: false,
                        message:
                            "Select a valid NGO, available food and meal quantity."
                    });

                    return;
                }

                const order = {
                    id: createId("ORDER"),

                    ngoId: ngo.id,
                    ngoName: ngo.name,
                    area: ngo.area,

                    requestedFoodId:
                        selectedFood.id,

                    requestedFoodName:
                        selectedFood.foodName,

                    requestedFoodCategory:
                        selectedFood.foodCategory,

                    requiredMeals,

                    allocatedMeals: 0,

                    remainingNeed:
                        requiredMeals,

                    needScore:
                        ngo.needScore,

                    status:
                        "WAITING_FOR_STOCK",

                    createdAt:
                        new Date().toISOString()
                };

                database.orders.unshift(
                    order
                );

                addNotification(
                    "NGO_REQUEST",
                    ngo.name,
                    `${ngo.name} requested ${requiredMeals} meals of ${selectedFood.foodName}.`
                );

                const allocations =
                    matchOrder(order);

                saveDatabase();

                sendJSON(response, 201, {
                    success: true,
                    order,
                    allocations,
                    message:
                        `${order.allocatedMeals}/${requiredMeals} meals of ${selectedFood.foodName} matched.`
                });

                return;
            }


            /* PUBLIC ALERT DEMO API */

            if (
                pathname ===
                    "/api/demo/escalate" &&
                request.method === "POST"
            ) {
                const data =
                    await readBody(request);

                const food =
                    database.foods.find(
                        (item) =>
                            item.id ===
                            data.foodId
                    );

                if (!food) {
                    sendJSON(response, 404, {
                        success: false,
                        message:
                            "Food listing not found."
                    });

                    return;
                }

                if (
                    Number(
                        food.remainingQuantity
                    ) <= 0
                ) {
                    sendJSON(response, 400, {
                        success: false,
                        message:
                            "No food quantity is left for public alert."
                    });

                    return;
                }

                food.alertStage = "NGO";

                food.ngoAlertDeadline =
                    new Date(
                        Date.now() - 1000
                    ).toISOString();

                checkExpiredAlerts();

                sendJSON(response, 200, {
                    success: true,
                    message:
                        "Public screen alert created."
                });

                return;
            }


            /* DELIVERY COMPLETE API */

            if (
                pathname ===
                    "/api/delivery/complete" &&
                request.method === "POST"
            ) {
                const data =
                    await readBody(request);

                const delivery =
                    database.deliveries.find(
                        (item) =>
                            item.id ===
                            data.deliveryId
                    );

                if (!delivery) {
                    sendJSON(response, 404, {
                        success: false,
                        message:
                            "Delivery not found."
                    });

                    return;
                }

                if (
                    delivery.status ===
                    "COMPLETED"
                ) {
                    sendJSON(response, 200, {
                        success: true,
                        message:
                            "Delivery is already completed.",
                        delivery
                    });

                    return;
                }

                if (
                    String(
                        data.pickupToken || ""
                    )
                        .trim()
                        .toUpperCase() !==
                    delivery.pickupToken
                ) {
                    sendJSON(response, 403, {
                        success: false,
                        message:
                            "Invalid pickup token."
                    });

                    return;
                }

                delivery.status =
                    "COMPLETED";

                delivery.deliveredAt =
                    new Date().toISOString();

                for (
                    const allocation of
                    delivery.allocations
                ) {
                    const food =
                        database.foods.find(
                            (item) =>
                                item.id ===
                                allocation.foodId
                        );

                    if (!food) {
                        continue;
                    }

                    food.reservedQuantity =
                        Math.max(
                            0,
                            Number(
                                food.reservedQuantity ||
                                0
                            ) -
                            allocation.quantity
                        );

                    if (
                        food.remainingQuantity ===
                            0 &&
                        food.reservedQuantity ===
                            0
                    ) {
                        food.status = "CLOSED";
                    }
                }

                saveDatabase();

                sendJSON(response, 200, {
                    success: true,
                    message:
                        "OTP verified and delivery completed.",
                    delivery
                });

                return;
            }


            /* UNKNOWN API */

            if (
                pathname.startsWith("/api/")
            ) {
                sendJSON(response, 404, {
                    success: false,
                    message:
                        "API route not found."
                });

                return;
            }


            /* WEBSITE FILES */

            const requestedFile =
                pathname === "/"
                    ? "index.html"
                    : pathname.replace(
                        /^\/+/,
                        ""
                    );

            const filePath =
                path.resolve(
                    PUBLIC_DIR,
                    requestedFile
                );

            const indexFile =
                path.join(
                    PUBLIC_DIR,
                    "index.html"
                );

            const safePath =
                filePath === indexFile ||
                filePath.startsWith(
                    PUBLIC_DIR + path.sep
                );

            if (!safePath) {
                response.writeHead(403, {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                });

                response.end(
                    "Access denied"
                );

                return;
            }

            fs.stat(
                filePath,
                (
                    error,
                    fileInformation
                ) => {
                    if (
                        !error &&
                        fileInformation.isFile()
                    ) {
                        serveFile(
                            response,
                            filePath
                        );

                        return;
                    }

                    serveFile(
                        response,
                        indexFile
                    );
                }
            );
        } catch (error) {
            console.error(
                "Server error:",
                error
            );

            if (!response.headersSent) {
                sendJSON(
                    response,
                    error.statusCode || 500,
                    {
                        success: false,
                        message:
                            error.message ||
                            "Internal server error."
                    }
                );
            }
        }
    }
);


/* =========================================
   START SERVER
========================================= */

server.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            "========================================"
        );

        console.log("REPLATE AI");

        console.log(
            `Website: http://localhost:${PORT}`
        );

        console.log(
            `Health: http://localhost:${PORT}/api/health`
        );

        console.log(
            "========================================"
        );
    }
);
