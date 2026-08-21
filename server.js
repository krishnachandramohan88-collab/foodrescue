/* =====================================================
   REPLATE AI / FOODRESCUE DEMO SERVER
   Stock Management Included
   No external package or API key required
===================================================== */

const http = require("http");
const fs = require("fs");
const path = require("path");


const PORT =
    Number(process.env.PORT) || 5000;


const PUBLIC_FOLDER =
    path.join(__dirname, "public");


const MIME_TYPES = {
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
   DEMO FOOD STOCK STORAGE
   Server restart hone par reset hoga
===================================================== */

let replateStock = {
    id: null,
    foodName: "",
    total: 0,
    reserved: 0,
    delivered: 0,
    remaining: 0,
    unit: "meals",
    rescueDeadline: null,
    status: "No Stock",
    communityAlert: false,
    updatedAt: null
};


/* =====================================================
   SEND JSON RESPONSE
===================================================== */

function sendJSON(
    response,
    statusCode,
    data
) {
    response.writeHead(statusCode, {
        "Content-Type":
            "application/json; charset=utf-8",

        "Cache-Control":
            "no-store",

        "Access-Control-Allow-Origin":
            "*",

        "Access-Control-Allow-Methods":
            "GET, POST, OPTIONS",

        "Access-Control-Allow-Headers":
            "Content-Type"
    });

    response.end(
        JSON.stringify(data)
    );
}


/* =====================================================
   READ JSON REQUEST BODY
===================================================== */

function readJSONBody(request) {
    return new Promise(
        (resolve, reject) => {
            let body = "";

            request.on("data", chunk => {
                body += chunk;

                if (body.length > 1000000) {
                    reject(
                        new Error(
                            "Request is too large."
                        )
                    );

                    request.destroy();
                }
            });

            request.on("end", () => {
                try {
                    const parsedBody =
                        body
                            ? JSON.parse(body)
                            : {};

                    resolve(parsedBody);

                } catch (error) {
                    reject(
                        new Error(
                            "Invalid JSON data."
                        )
                    );
                }
            });

            request.on(
                "error",
                reject
            );
        }
    );
}


/* =====================================================
   SEND STATIC FILE
===================================================== */

function sendFile(
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
                    "File not found"
                );

                return;
            }

            const extension =
                path
                    .extname(filePath)
                    .toLowerCase();

            response.writeHead(200, {
                "Content-Type":
                    MIME_TYPES[extension] ||
                    "application/octet-stream",

                "Cache-Control":
                    "no-store"
            });

            response.end(fileData);
        }
    );
}


/* =====================================================
   UPDATE STOCK STATUS
===================================================== */

function updateStockStatus() {
    if (!replateStock.id) {
        replateStock.status =
            "No Stock";

        return;
    }

    if (
        replateStock.remaining === 0 &&
        replateStock.reserved === 0 &&
        replateStock.delivered ===
            replateStock.total
    ) {
        replateStock.status =
            "Delivered";

        return;
    }

    if (replateStock.reserved > 0) {
        replateStock.status =
            replateStock.remaining > 0
                ? "Partially Reserved"
                : "Fully Reserved";

        return;
    }

    if (
        replateStock.delivered > 0 &&
        replateStock.remaining > 0
    ) {
        replateStock.status =
            "Partially Delivered";

        return;
    }

    if (replateStock.communityAlert) {
        replateStock.status =
            "Community Alert Live";

        return;
    }

    if (replateStock.remaining > 0) {
        replateStock.status =
            "Available";
    }
}


/* =====================================================
   CREATE SERVER
===================================================== */

const server =
    http.createServer(
        async (
            request,
            response
        ) => {
            try {
                const requestUrl =
                    new URL(
                        request.url,
                        `http://${
                            request.headers.host ||
                            "localhost"
                        }`
                    );

                const pathname =
                    decodeURIComponent(
                        requestUrl.pathname
                    );


                /* =====================================
                   CORS PREFLIGHT
                ===================================== */

                if (request.method === "OPTIONS") {
                    response.writeHead(204, {
                        "Access-Control-Allow-Origin":
                            "*",

                        "Access-Control-Allow-Methods":
                            "GET, POST, OPTIONS",

                        "Access-Control-Allow-Headers":
                            "Content-Type"
                    });

                    response.end();
                    return;
                }


                /* =====================================
                   SERVER STATUS API
                ===================================== */

                if (
                    pathname === "/api/health" &&
                    request.method === "GET"
                ) {
                    sendJSON(response, 200, {
                        success: true,
                        mode: "DEMO",
                        aiEnabled: true,
                        model:
                            "RePlate Demo Engine",

                        features: [
                            "Food risk analysis",
                            "Human safety verification",
                            "NGO matching",
                            "Food stock management",
                            "Partial food acceptance",
                            "Delivery verification",
                            "Community screen alert",
                            "Impact tracking"
                        ],

                        message:
                            "Complete rescue demo is ready. No external AI API is being used."
                    });

                    return;
                }


                /* =====================================
                   GET CURRENT FOOD STOCK
                ===================================== */

                if (
                    pathname === "/api/stock" &&
                    request.method === "GET"
                ) {
                    sendJSON(response, 200, {
                        success: true,
                        stock: replateStock
                    });

                    return;
                }


                /* =====================================
                   CREATE NEW FOOD STOCK
                ===================================== */

                if (
                    pathname === "/api/stock" &&
                    request.method === "POST"
                ) {
                    const data =
                        await readJSONBody(
                            request
                        );

                    const total =
                        Number(data.total);

                    if (
                        !Number.isFinite(total) ||
                        total <= 0
                    ) {
                        sendJSON(response, 400, {
                            success: false,
                            message:
                                "Enter a valid food quantity."
                        });

                        return;
                    }

                    replateStock = {
                        id:
                            `STOCK-${Date.now()}`,

                        foodName:
                            data.foodName ||
                            "Prepared Food",

                        total,
                        reserved: 0,
                        delivered: 0,
                        remaining: total,

                        unit:
                            data.unit ||
                            "meals",

                        rescueDeadline:
                            data.rescueDeadline ||
                            null,

                        status:
                            "Available",

                        communityAlert:
                            false,

                        updatedAt:
                            new Date()
                                .toISOString()
                    };

                    sendJSON(response, 201, {
                        success: true,
                        message:
                            "Food stock created successfully.",

                        stock:
                            replateStock
                    });

                    return;
                }


                /* =====================================
                   NGO PARTIAL ACCEPTANCE
                ===================================== */

                if (
                    pathname ===
                        "/api/stock/accept" &&
                    request.method === "POST"
                ) {
                    if (!replateStock.id) {
                        sendJSON(response, 404, {
                            success: false,
                            message:
                                "No active food stock found."
                        });

                        return;
                    }

                    const data =
                        await readJSONBody(
                            request
                        );

                    const quantity =
                        Number(data.quantity);

                    if (
                        !Number.isFinite(quantity) ||
                        quantity <= 0
                    ) {
                        sendJSON(response, 400, {
                            success: false,
                            message:
                                "Enter a valid accepted quantity."
                        });

                        return;
                    }

                    if (
                        quantity >
                        replateStock.remaining
                    ) {
                        sendJSON(response, 400, {
                            success: false,

                            message:
                                `Only ${
                                    replateStock.remaining
                                } ${
                                    replateStock.unit
                                } are available.`
                        });

                        return;
                    }

                    replateStock.reserved +=
                        quantity;

                    replateStock.remaining -=
                        quantity;

                    replateStock.updatedAt =
                        new Date()
                            .toISOString();

                    updateStockStatus();

                    sendJSON(response, 200, {
                        success: true,

                        message:
                            `${quantity} ${
                                replateStock.unit
                            } reserved by NGO.`,

                        stock:
                            replateStock
                    });

                    return;
                }


                /* =====================================
                   NGO ACCEPT ALL REMAINING STOCK
                ===================================== */

                if (
                    pathname ===
                        "/api/stock/accept-all" &&
                    request.method === "POST"
                ) {
                    if (!replateStock.id) {
                        sendJSON(response, 404, {
                            success: false,
                            message:
                                "No active food stock found."
                        });

                        return;
                    }

                    if (
                        replateStock.remaining <= 0
                    ) {
                        sendJSON(response, 400, {
                            success: false,
                            message:
                                "No remaining food stock is available."
                        });

                        return;
                    }

                    const acceptedQuantity =
                        replateStock.remaining;

                    replateStock.reserved +=
                        acceptedQuantity;

                    replateStock.remaining = 0;

                    replateStock.updatedAt =
                        new Date()
                            .toISOString();

                    updateStockStatus();

                    sendJSON(response, 200, {
                        success: true,

                        message:
                            `${acceptedQuantity} ${
                                replateStock.unit
                            } reserved by NGO.`,

                        stock:
                            replateStock
                    });

                    return;
                }


                /* =====================================
                   MARK RESERVED STOCK DELIVERED
                ===================================== */

                if (
                    pathname ===
                        "/api/stock/deliver" &&
                    request.method === "POST"
                ) {
                    if (!replateStock.id) {
                        sendJSON(response, 404, {
                            success: false,
                            message:
                                "No active food stock found."
                        });

                        return;
                    }

                    if (
                        replateStock.reserved <= 0
                    ) {
                        sendJSON(response, 400, {
                            success: false,
                            message:
                                "No reserved food is available for delivery."
                        });

                        return;
                    }

                    const deliveredNow =
                        replateStock.reserved;

                    replateStock.delivered +=
                        deliveredNow;

                    replateStock.reserved = 0;

                    replateStock.updatedAt =
                        new Date()
                            .toISOString();

                    updateStockStatus();

                    sendJSON(response, 200, {
                        success: true,

                        message:
                            `${deliveredNow} ${
                                replateStock.unit
                            } marked as delivered.`,

                        stock:
                            replateStock
                    });

                    return;
                }


                /* =====================================
                   COMMUNITY SCREEN ALERT
                ===================================== */

                if (
                    pathname ===
                        "/api/stock/community-alert" &&
                    request.method === "POST"
                ) {
                    if (!replateStock.id) {
                        sendJSON(response, 404, {
                            success: false,
                            message:
                                "No active food stock found."
                        });

                        return;
                    }

                    if (
                        replateStock.remaining <= 0
                    ) {
                        sendJSON(response, 400, {
                            success: false,
                            message:
                                "No remaining stock is available for a community alert."
                        });

                        return;
                    }

                    replateStock.communityAlert =
                        true;

                    replateStock.updatedAt =
                        new Date()
                            .toISOString();

                    updateStockStatus();

                    sendJSON(response, 200, {
                        success: true,

                        message:
                            `${replateStock.remaining} ${
                                replateStock.unit
                            } available for controlled community pickup.`,

                        stock:
                            replateStock
                    });

                    return;
                }


                /* =====================================
                   RESET STOCK — DEMO ONLY
                ===================================== */

                if (
                    pathname ===
                        "/api/stock/reset" &&
                    request.method === "POST"
                ) {
                    replateStock = {
                        id: null,
                        foodName: "",
                        total: 0,
                        reserved: 0,
                        delivered: 0,
                        remaining: 0,
                        unit: "meals",
                        rescueDeadline: null,
                        status: "No Stock",
                        communityAlert: false,
                        updatedAt: null
                    };

                    sendJSON(response, 200, {
                        success: true,
                        message:
                            "Demo food stock reset successfully.",

                        stock:
                            replateStock
                    });

                    return;
                }


                /* =====================================
                   UNKNOWN API ROUTE
                ===================================== */

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


                /* =====================================
                   STATIC FILE PATH
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
                        PUBLIC_FOLDER,
                        requestedFile
                    );

                const publicIndex =
                    path.join(
                        PUBLIC_FOLDER,
                        "index.html"
                    );

                const isInsidePublicFolder =
                    filePath === publicIndex ||
                    filePath.startsWith(
                        PUBLIC_FOLDER +
                        path.sep
                    );


                /* =====================================
                   BLOCK UNSAFE PATHS
                ===================================== */

                if (!isInsidePublicFolder) {
                    response.writeHead(403, {
                        "Content-Type":
                            "text/plain; charset=utf-8"
                    });

                    response.end(
                        "Access denied"
                    );

                    return;
                }


                /* =====================================
                   SERVE REQUESTED FILE
                ===================================== */

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
                            sendFile(
                                response,
                                filePath
                            );

                            return;
                        }

                        // Unknown website URL opens homepage
                        sendFile(
                            response,
                            publicIndex
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
            "🍽️ REPLATE AI / FOODRESCUE"
        );

        console.log(
            "🤖 COMPLETE DEMO MODE"
        );

        console.log(
            `🌐 Website: http://localhost:${PORT}`
        );

        console.log(
            `❤️ Health: http://localhost:${PORT}/api/health`
        );

        console.log(
            `📦 Stock: http://localhost:${PORT}/api/stock`
        );

        console.log(
            "✅ Food stock management"
        );

        console.log(
            "✅ NGO partial acceptance"
        );

        console.log(
            "✅ Delivery verification"
        );

        console.log(
            "✅ Community screen alert"
        );

        console.log(
            "🔑 API Key: NOT REQUIRED"
        );

        console.log(
            "========================================"
        );
    }
);
