/* =====================================================
   REPLATE AI / FOODRESCUE DEMO SERVER
   No external package or API key required
===================================================== */

const http =
    require("http");

const fs =
    require("fs");

const path =
    require("path");


const PORT =
    Number(
        process.env.PORT
    ) || 5000;


const PUBLIC_FOLDER =
    path.join(
        __dirname,
        "public"
    );


const MIME_TYPES = {

    ".html":
        "text/html; charset=utf-8",

    ".css":
        "text/css; charset=utf-8",

    ".js":
        "text/javascript; charset=utf-8",

    ".json":
        "application/json; charset=utf-8",

    ".svg":
        "image/svg+xml",

    ".png":
        "image/png",

    ".jpg":
        "image/jpeg",

    ".jpeg":
        "image/jpeg",

    ".webp":
        "image/webp",

    ".ico":
        "image/x-icon"
};


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

                response.writeHead(
                    404,
                    {
                        "Content-Type":
                            "text/plain; charset=utf-8"
                    }
                );

                response.end(
                    "File not found"
                );

                return;
            }


            const extension =
                path
                    .extname(
                        filePath
                    )
                    .toLowerCase();


            response.writeHead(
                200,
                {
                    "Content-Type":
                        MIME_TYPES[
                            extension
                        ] ||
                        "application/octet-stream",

                    "Cache-Control":
                        "no-store"
                }
            );


            response.end(
                fileData
            );
        }
    );
}


/* =====================================================
   CREATE SERVER
===================================================== */

const server =
    http.createServer(
        (
            request,
            response
        ) => {

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


            /* =========================================
               DEMO SERVER STATUS API
            ========================================= */

            if (
                pathname ===
                "/api/health"
            ) {

                response.writeHead(
                    200,
                    {
                        "Content-Type":
                            "application/json; charset=utf-8"
                    }
                );


                response.end(
                    JSON.stringify({
                        success:
                            true,

                        mode:
                            "DEMO",

                        aiEnabled:
                            true,

                        model:
                            "RePlate Demo Engine",

                        features: [
                            "Food risk analysis",
                            "Human safety verification",
                            "NGO matching",
                            "Partial food acceptance",
                            "Delivery verification",
                            "Public screen alert",
                            "Impact tracking"
                        ],

                        message:
                            "Complete rescue demo is ready. No external AI API is being used."
                    })
                );


                return;
            }


            /* =========================================
               STATIC FILE PATH
            ========================================= */

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

                filePath ===
                    publicIndex ||

                filePath.startsWith(
                    PUBLIC_FOLDER +
                    path.sep
                );


            /* =========================================
               BLOCK UNSAFE PATHS
            ========================================= */

            if (
                !isInsidePublicFolder
            ) {

                response.writeHead(
                    403,
                    {
                        "Content-Type":
                            "text/plain; charset=utf-8"
                    }
                );


                response.end(
                    "Access denied"
                );


                return;
            }


            /* =========================================
               SERVE REQUESTED FILE
            ========================================= */

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


                    // Unknown URL opens website homepage

                    sendFile(
                        response,
                        publicIndex
                    );
                }
            );
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
            "✅ Food risk analysis"
        );

        console.log(
            "✅ NGO matching"
        );

        console.log(
            "✅ Delivery verification"
        );

        console.log(
            "✅ Public screen alert"
        );

        console.log(
            "🔑 API Key: NOT REQUIRED"
        );

        console.log(
            "========================================"
        );
    }
);