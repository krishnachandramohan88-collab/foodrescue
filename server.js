const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");


const PORT =
    Number(process.env.PORT) || 5000;

const PUBLIC_DIR =
    path.join(__dirname, "public");

const DATA_DIR =
    path.join(__dirname, "data");

const STORE_FILE =
    path.join(DATA_DIR, "store.json");

const NGO_RESPONSE_TIME =
    10 * 60 * 1000;


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


/* =====================================================
   VERIFIED NGO DATA
===================================================== */

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


/* =====================================================
   DATABASE
===================================================== */

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
        const data =
            fs.readFileSync(
                STORE_FILE,
                "utf8"
            );

        return JSON.parse(data);

    } catch (error) {
        return createEmptyDatabase();
    }
}


let database =
    loadDatabase();


function saveDatabase() {
    fs.mkdirSync(
        DATA_DIR,
        {
            recursive: true
        }
    );

    fs.writeFileSync(
        STORE_FILE,
        JSON.stringify(
            database,
            null,
            2
        )
    );
}


/* =====================================================
   HELPERS
===================================================== */

function createId(prefix) {
    return (
        `${prefix}-${Date.now()}-` +
        crypto
            .randomBytes(2)
            .toString("hex")
            .toUpperCase()
    );
}


function createToken() {
    return crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase();
}


function sendJSON(
    response,
    statusCode,
    data
) {
    response.writeHead(statusCode, {
        "Content-Type":
            "application/json; charset=utf-8",

        "Cache-Control":
            "no-store"
    });

    response.end(
        JSON.stringify(data)
    );
}


function readBody(request) {
    return new Promise(
        (
            resolve,
            reject
        ) => {
            let body = "";

            request.on(
                "data",
                chunk => {
                    body += chunk;

                    if (
                        body.length >
                        4000000
                    ) {
                        reject(
                            new Error(
                                "Request is too large."
                            )
                        );

                        request.destroy();
                    }
                }
            );

            request.on(
                "end",
                () => {
                    try {
                        resolve(
                            body
                                ? JSON.parse(body)
                                : {}
                        );

                    } catch (error) {
                        reject(
                            new Error(
                                "Invalid JSON request."
                            )
                        );
                    }
                }
            );

            request.on(
                "error",
                reject
            );
        }
    );
}


function addNotification(
    type,
    receiver,
    message,
    channel = "APP"
) {
    database.notifications.unshift({
        id:
            createId("NOTIFICATION"),

        type,
        receiver,
        message,
        channel,

        status:
            "SIMULATED_SENT",

        createdAt:
            new Date().toISOString()
    });

    database.notifications =
        database.notifications.slice(
            0,
            100
        );
}


/* =====================================================
   FOOD RISK ANALYSIS
===================================================== */

function calculateRisk(data) {
    let score = 0;

    const reasons = [];

    const hours =
        Number(data.hours) || 0;

    const temperature =
        Number(data.temperature) || 0;


    if (hours >= 6) {
        score += 5;

        reasons.push(
            "Long holding time"
        );

    } else if (hours >= 3) {
        score += 3;

        reasons.push(
            "Prompt rescue required"
        );
    }


    if (
        data.storage ===
        "Room temperature"
    ) {
        score += 4;

        reasons.push(
            "Room-temperature storage"
        );
    }


    if (
        data.storage ===
            "Refrigerated" &&
        temperature > 5
    ) {
        score += 3;

        reasons.push(
            "Refrigeration above target"
        );
    }


    if (
        data.packaging === "Open"
    ) {
        score += 2;

        reasons.push(
            "Open packaging"
        );
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


/* =====================================================
   CREATE DELIVERY
===================================================== */

function createDelivery(
    order,
    allocations
) {
    const partner =
        deliveryPartners[
            database.deliveries.length %
            deliveryPartners.length
        ];


    const totalMeals =
        allocations.reduce(
            (
                total,
                allocation
            ) =>
                total +
                allocation.quantity,

            0
        );


    const delivery = {
        id:
            createId("DELIVERY"),

        orderId:
            order.id,

        ngoName:
            order.ngoName,

        partner,

        allocations,

        pickupToken:
            createToken(),

        status:
            "PARTNER_NOTIFIED",

        createdAt:
            new Date().toISOString()
    };


    database.deliveries.unshift(
        delivery
    );


    addNotification(
        "DELIVERY",
        partner,
        `Pickup ${totalMeals} meals for ${order.ngoName}.`
    );


    return delivery;
}


/* =====================================================
   MATCH NGO ORDER
===================================================== */

function matchOrder(order) {
    let required =
        order.remainingNeed;

    const allocations = [];


    const availableFoods =
        database.foods
            .filter(food =>
                food.safetyStatus ===
                    "APPROVED" &&

                food.status ===
                    "AVAILABLE" &&

                food.remainingQuantity > 0 &&

                new Date(
                    food.pickupDeadline
                ).getTime() >
                    Date.now()
            )
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
            );


    for (
        const food of availableFoods
    ) {
        if (required <= 0) {
            break;
        }


        const allocated =
            Math.min(
                required,
                food.remainingQuantity
            );


        food.remainingQuantity -=
            allocated;

        food.reservedQuantity +=
            allocated;

        required -=
            allocated;


        if (
            food.remainingQuantity === 0
        ) {
            food.status =
                "FULLY_RESERVED";
        }


        allocations.push({
            foodId:
                food.id,

            restaurantName:
                food.restaurantName,

            foodName:
                food.foodName,

            exactLocation:
                food.exactLocation,

            quantity:
                allocated
        });
    }


    const matched =
        order.remainingNeed -
        required;


    order.allocatedMeals +=
        matched;

    order.remainingNeed =
        required;


    if (required === 0) {
        order.status =
            "FULLY_MATCHED";

    } else if (
        order.allocatedMeals > 0
    ) {
        order.status =
            "PARTIALLY_MATCHED";

    } else {
        order.status =
            "WAITING_FOR_STOCK";
    }


    if (allocations.length > 0) {
        createDelivery(
            order,
            allocations
        );
    }


    return allocations;
}


/* =====================================================
   MATCH NEW HOTEL FOOD
===================================================== */

function matchNewFood(food) {
    const pendingOrders =
        database.orders
            .filter(order =>
                order.remainingNeed > 0
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    second.needScore -
                        first.needScore ||

                    new Date(first.createdAt) -
                        new Date(
                            second.createdAt
                        )
            );


    const matches = [];


    for (
        const order of pendingOrders
    ) {
        if (
            food.remainingQuantity <= 0
        ) {
            break;
        }


        const before =
            order.allocatedMeals;


        const allocations =
            matchOrder(order)
                .filter(
                    allocation =>
                        allocation.foodId ===
                        food.id
                );


        if (
            order.allocatedMeals > before
        ) {
            matches.push({
                orderId:
                    order.id,

                ngoName:
                    order.ngoName,

                allocations
            });
        }
    }


    if (
        food.remainingQuantity > 0
    ) {
        const nearbyNGOs =
            [...ngoDirectory]
                .sort(
                    (
                        first,
                        second
                    ) =>
                        second.needScore -
                            first.needScore ||

                        first.distanceKm -
                            second.distanceKm
                );


        food.alertStage =
            "NGO";

        food.ngoAlertDeadline =
            new Date(
                Date.now() +
                NGO_RESPONSE_TIME
            ).toISOString();


        nearbyNGOs.forEach(
            ngo => {
                addNotification(
                    "FOOD_ALERT",

                    ngo.name,

                    `${food.remainingQuantity} meals of ${food.foodName} available near ${food.area}.`
                );
            }
        );
    }


    return matches;
}


/* =====================================================
   PUBLIC SCREEN ESCALATION
===================================================== */

function checkExpiredAlerts() {
    let changed = false;


    database.foods.forEach(
        food => {
            if (
                food.alertStage === "NGO" &&

                food.remainingQuantity > 0 &&

                food.ngoAlertDeadline &&

                Date.now() >=
                    new Date(
                        food.ngoAlertDeadline
                    ).getTime()
            ) {
                food.alertStage =
                    "PUBLIC";

                food.status =
                    "PUBLIC_ALERT";


                const alreadyExists =
                    database.publicAlerts
                        .some(
                            alert =>
                                alert.foodId ===
                                    food.id &&

                                alert.status ===
                                    "ACTIVE"
                        );


                if (!alreadyExists) {
                    const publicAlert = {
                        id:
                            createId("PUBLIC"),

                        foodId:
                            food.id,

                        foodName:
                            food.foodName,

                        quantity:
                            food.remainingQuantity,

                        area:
                            food.area,

                        pickupDeadline:
                            food.pickupDeadline,

                        status:
                            "ACTIVE",

                        createdAt:
                            new Date()
                                .toISOString()
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
        }
    );


    if (changed) {
        saveDatabase();
    }
}


setInterval(
    checkExpiredAlerts,
    5000
);


/* =====================================================
   STATIC FILE
===================================================== */

function serveFile(
    response,
    filePath
) {
    fs.readFile(
        filePath,
        (
            error,
            fileData
        ) => {
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


/* =====================================================
   SERVER
===================================================== */

const server =
    http.createServer(
        async (
            request,
            response
        ) => {
            try {
                const url =
                    new URL(
                        request.url,
                        "http://localhost"
                    );

                const pathname =
                    decodeURIComponent(
                        url.pathname
                    );


                /* =====================================
                   HEALTH
                ===================================== */

                if (
                    pathname ===
                        "/api/health" &&
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


                /* =====================================
                   DASHBOARD
                ===================================== */

                if (
                    pathname ===
                        "/api/dashboard" &&
                    request.method === "GET"
                ) {
                    checkExpiredAlerts();

                    sendJSON(response, 200, {
                        success: true,
                        foods:
                            database.foods,
                        orders:
                            database.orders,
                        notifications:
                            database.notifications,
                        deliveries:
                            database.deliveries,
                        publicAlerts:
                            database.publicAlerts,
                        ngos:
                            ngoDirectory
                    });

                    return;
                }


                /* =====================================
                   ADD VERIFIED FOOD
                ===================================== */

                if (
                    pathname ===
                        "/api/food" &&
                    request.method === "POST"
                ) {
                    const data =
                        await readBody(
                            request
                        );

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
                        data.packaging ===
                        "Damaged"
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
                        id:
                            createId("FOOD"),

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
                                90 * 60000
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
                            new Date()
                                .toISOString()
                    };


                    database.foods.unshift(
                        food
                    );


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


                /* =====================================
                   CREATE NGO REQUIREMENT
                ===================================== */

                if (
                    pathname ===
                        "/api/orders" &&
                    request.method === "POST"
                ) {
                    const data =
                        await readBody(
                            request
                        );

                    const requiredMeals =
                        Math.floor(
                            Number(
                                data.requiredMeals
                            )
                        );

                    const ngo =
                        ngoDirectory.find(
                            item =>
                                item.id ===
                                data.ngoId
                        );


                    if (
                        !ngo ||
                        !Number.isFinite(
                            requiredMeals
                        ) ||
                        requiredMeals < 1
                    ) {
                        sendJSON(response, 400, {
                            success: false,
                            message:
                                "Valid NGO and meal requirement required."
                        });

                        return;
                    }


                    const order = {
                        id:
                            createId("ORDER"),

                        ngoId:
                            ngo.id,

                        ngoName:
                            ngo.name,

                        requiredMeals,

                        allocatedMeals:
                            0,

                        remainingNeed:
                            requiredMeals,

                        needScore:
                            ngo.needScore,

                        status:
                            "WAITING_FOR_STOCK",

                        createdAt:
                            new Date()
                                .toISOString()
                    };


                    database.orders.unshift(
                        order
                    );


                    const allocations =
                        matchOrder(order);


                    saveDatabase();


                    sendJSON(response, 201, {
                        success: true,
                        order,
                        allocations,

                        message:
                            `${order.allocatedMeals}/${requiredMeals} meals matched.`
                    });

                    return;
                }


                /* =====================================
                   PUBLIC SCREEN DEMO
                ===================================== */

                if (
                    pathname ===
                        "/api/demo/escalate" &&
                    request.method === "POST"
                ) {
                    const data =
                        await readBody(
                            request
                        );

                    const food =
                        database.foods.find(
                            item =>
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


                    food.alertStage =
                        "NGO";

                    food.ngoAlertDeadline =
                        new Date(
                            Date.now() -
                            1000
                        ).toISOString();


                    checkExpiredAlerts();


                    sendJSON(response, 200, {
                        success: true,
                        message:
                            "Public screen alert created."
                    });

                    return;
                }


                /* =====================================
                   COMPLETE DELIVERY WITH OTP
                ===================================== */

                if (
                    pathname ===
                        "/api/delivery/complete" &&
                    request.method === "POST"
                ) {
                    const data =
                        await readBody(
                            request
                        );

                    const delivery =
                        database.deliveries.find(
                            item =>
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
                        String(
                            data.pickupToken || ""
                        ).toUpperCase() !==
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
                        "DELIVERED";

                    delivery.deliveredAt =
                        new Date()
                            .toISOString();


                    delivery.allocations.forEach(
                        allocation => {
                            const food =
                                database.foods.find(
                                    item =>
                                        item.id ===
                                        allocation.foodId
                                );


                            if (food) {
                                food.reservedQuantity -=
                                    allocation.quantity;


                                if (
                                    food.remainingQuantity ===
                                        0 &&
                                    food.reservedQuantity ===
                                        0
                                ) {
                                    food.status =
                                        "CLOSED";
                                }
                            }
                        }
                    );


                    saveDatabase();


                    sendJSON(response, 200, {
                        success: true,
                        message:
                            "OTP verified and delivery completed.",
                        delivery
                    });

                    return;
                }


                /* =====================================
                   UNKNOWN API
                ===================================== */

                if (
                    pathname.startsWith(
                        "/api/"
                    )
                ) {
                    sendJSON(response, 404, {
                        success: false,
                        message:
                            "API route not found."
                    });

                    return;
                }


                /* =====================================
                   WEBSITE FILES
                ===================================== */

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
                        PUBLIC_DIR +
                        path.sep
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
                    sendJSON(response, 500, {
                        success: false,
                        message:
                            error.message ||
                            "Internal server error."
                    });
                }
            }
        }
    );


/* =====================================================
   START SERVER
===================================================== */

server.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            "========================================"
        );

        console.log(
            "REPLATE AI"
        );

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