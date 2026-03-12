console.log("Starting server…"); 
import express, { type Request, Response, NextFunction } from "express";
// load environment variables from .env file as early as possible
import dotenv from "dotenv";
dotenv.config();
import session from "express-session";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

import MongoStore from "connect-mongo";
import createMemoryStore from "memorystore";

const app = express();
const httpServer = createServer(app);

// Render (and many PaaS) terminate TLS at a proxy/load balancer.
// Trust the proxy so `req.secure` is correct and secure cookies work.
app.set("trust proxy", 1);



declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

import path from "path";

app.use(express.urlencoded({ extended: false }));

// Serve uploaded images
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === "production",
    store: (() => {
      const mongoUrl = process.env.MONGO_URI;
      if (mongoUrl) {
        return MongoStore.create({
          mongoUrl,
          ttl: 7 * 24 * 60 * 60, // 7 days
        });
      }

      // Fallback for environments where Mongo isn't configured (e.g. preview builds).
      // In production you should set `MONGO_URI` to persist sessions across restarts.
      const MemoryStore = createMemoryStore(session);
      return new MemoryStore({
        checkPeriod: 24 * 60 * 60 * 1000, // prune expired entries daily
      });
    })(),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      // Use secure cookies in production, but auto-detect HTTPS behind proxies.
      secure: process.env.NODE_ENV === "production" ? "auto" : false,
    },
  }),
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Startup block with robust error handling for production
(async () => {
  try {
    // establish database connection before registering routes
    const { connectDB } = await import("./db");
    await connectDB();
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error("Internal Server Error:", err);

      if (res.headersSent) {
        return next(err);
      }

      return res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
      },
      () => {
        log(`serving on port ${port}`);
      },
    );
  } catch (err) {
    // Log the error and exit gracefully
    console.error("Fatal startup error:", err);
    if (err instanceof Error) {
      // Print stack trace for debugging
      console.error(err.stack);
    }
    process.exit(1);
  }
})();
