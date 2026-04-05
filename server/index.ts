import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import * as fs from "fs";
import * as path from "path";

const app = express();
const log = console.log;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    const origins = new Set<string>();

    if (process.env.ALLOWED_ORIGINS) {
      process.env.ALLOWED_ORIGINS.split(",").forEach((o) => {
        origins.add(o.trim());
      });
    }

    const origin = req.header("origin");

    const isLocalhost =
      origin?.startsWith("http://localhost:") ||
      origin?.startsWith("http://127.0.0.1:");

    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      if (!path.startsWith("/api")) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}

interface AssetMetadata {
  path: string;
  ext: string;
}

interface PlatformMetadata {
  bundle: string;
  assets: AssetMetadata[];
}

interface ExportMetadata {
  version: number;
  bundler: string;
  fileMetadata: Record<string, PlatformMetadata>;
}

interface ExpoConfig {
  name?: string;
  slug?: string;
  version?: string;
  [key: string]: string | boolean | number | Record<string, unknown> | unknown[] | undefined;
}

const EXT_CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
};

function getExpoConfig(): ExpoConfig {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent) as { expo?: ExpoConfig };
    return appJson.expo || {};
  } catch {
    return {};
  }
}

function getBaseUrl(req: Request): string {
  const protocol = req.header("x-forwarded-proto") || req.protocol || "https";
  const host = req.header("x-forwarded-host") || req.get("host");
  return `${protocol}://${host}`;
}

function serveExpoManifest(platform: string, req: Request, res: Response) {
  const metadataPath = path.resolve(process.cwd(), "static-build", "metadata.json");

  if (!fs.existsSync(metadataPath)) {
    return res.status(404).json({ error: "Build metadata not found" });
  }

  const metadata: ExportMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
  const platformData = metadata.fileMetadata[platform];

  if (!platformData) {
    return res.status(404).json({ error: `No build found for platform: ${platform}` });
  }

  const baseUrl = getBaseUrl(req);
  const expoConfig = getExpoConfig();
  const expoVersion = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "node_modules", "expo", "package.json"), "utf-8"),
  ).version as string;

  const bundleFilename = path.basename(platformData.bundle, path.extname(platformData.bundle));

  const manifest = {
    id: bundleFilename,
    createdAt: new Date().toISOString(),
    runtimeVersion: `exposdk:${expoVersion}`,
    launchAsset: {
      key: "bundle",
      contentType: "application/javascript",
      url: `${baseUrl}/${platformData.bundle}`,
    },
    assets: platformData.assets.map((asset) => ({
      key: path.basename(asset.path),
      contentType: EXT_CONTENT_TYPES[asset.ext] || "application/octet-stream",
      fileExtension: `.${asset.ext}`,
      url: `${baseUrl}/${asset.path}`,
    })),
    metadata: {},
    extra: {
      expoClient: expoConfig,
    },
  };

  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  res.send(JSON.stringify(manifest));
}

function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName,
}: {
  req: Request;
  res: Response;
  landingPageTemplate: string;
  appName: string;
}) {
  const baseUrl = getBaseUrl(req);
  const host = req.header("x-forwarded-host") || req.get("host");

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, host || "")
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

function configureExpoAndLanding(app: express.Application) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html",
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const expoConfig = getExpoConfig();
  const appName = expoConfig.name || "App Landing Page";

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }

    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, req, res);
    }

    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName,
      });
    }

    next();
  });

  app.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app.use(express.static(path.resolve(process.cwd(), "static-build")));
}

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
    };

    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });
}

(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);

  configureExpoAndLanding(app);

  const server = await registerRoutes(app);

  setupErrorHandler(app);

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`express server serving on port ${port}`);
    },
  );
})();
