import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { loadPages } from "../scripts/pages.mjs";

const deployScript = fileURLToPath(new URL("../scripts/deploy-campuspress.mjs", import.meta.url));

test("discovers content files without a page mapping", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "boat-pages-"));
  try {
    await mkdir(path.join(root, "content"));
    await writeFile(path.join(root, "campuspress.json"), JSON.stringify({ pageMetadata: { home: { title: "Home" } } }));
    await writeFile(path.join(root, "content/home.html"), "<p>Home</p>");
    await writeFile(path.join(root, "content/new-page.html"), "<p>New</p>");
    const { pages } = await loadPages(root);
    assert.deepEqual(pages.map(({ slug, route, title }) => ({ slug, route, title })), [
      { slug: "home", route: "/", title: "Home" },
      { slug: "new-page", route: "/new-page/", title: "New Page" },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("creates a draft, updates only draft content, and refuses published pages", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "boat-sync-"));
  let page;
  const writes = [];
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    assert.equal(req.headers.authorization, `Basic ${Buffer.from("user:password").toString("base64")}`);
    res.setHeader("content-type", "application/json");
    if (req.method === "GET" && url.pathname === "/wp-json/wp/v2/pages") {
      assert.equal(url.searchParams.get("slug"), "draft-home");
      assert.equal(url.searchParams.get("status"), "any");
      res.end(JSON.stringify(page ? [page] : []));
    } else if (req.method === "GET" && url.pathname === "/wp-json/wp/v2/pages/54") {
      res.end(JSON.stringify(page));
    } else if (req.method === "POST" && url.pathname.startsWith("/wp-json/wp/v2/pages")) {
      let body = "";
      for await (const chunk of req) body += chunk;
      const data = JSON.parse(body);
      writes.push({ url: url.pathname, data });
      page = { id: 54, slug: data.slug ?? page.slug, status: data.status ?? page.status };
      res.end(JSON.stringify(page));
    } else {
      res.writeHead(404);
      res.end("{}");
    }
  });

  try {
    await mkdir(path.join(root, "content"));
    await writeFile(path.join(root, "campuspress.json"), JSON.stringify({ pageMetadata: { home: { title: "Home" } } }));
    await writeFile(path.join(root, "content/home.html"), "<p>Home</p>");
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const run = () => new Promise((resolve) => {
      const child = spawn(process.execPath, [deployScript], {
        cwd: root,
        env: {
          ...process.env,
          CAMPUSPRESS_BASE_URL: `http://127.0.0.1:${server.address().port}`,
          CAMPUSPRESS_USERNAME: "user",
          CAMPUSPRESS_APP_PASSWORD: "password",
          DRY_RUN: "0",
        },
      });
      let stderr = "";
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("close", (code) => resolve({ code, stderr }));
    });

    assert.equal((await run()).code, 0);
    assert.deepEqual(writes[0], {
      url: "/wp-json/wp/v2/pages",
      data: { content: "<p>Home</p>", slug: "draft-home", title: "Home", status: "draft" },
    });
    assert.equal((await run()).code, 0);
    assert.deepEqual(writes[1], { url: "/wp-json/wp/v2/pages/54", data: { content: "<p>Home</p>" } });

    page.status = "publish";
    const refused = await run();
    assert.notEqual(refused.code, 0);
    assert.match(refused.stderr, /Refusing to update draft-home/);
    assert.equal(writes.length, 2);
  } finally {
    server.close();
    await rm(root, { recursive: true, force: true });
  }
});
