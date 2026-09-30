import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export async function loadPages(root) {
  const config = JSON.parse(await readFile(path.join(root, "campuspress.json"), "utf8"));
  const metadata = config.pageMetadata ?? {};
  const order = Object.keys(metadata);
  const files = (await readdir(path.join(root, "content")))
    .filter((file) => file.endsWith(".html"))
    .sort((a, b) => {
      const first = order.indexOf(path.parse(a).name);
      const second = order.indexOf(path.parse(b).name);
      return (first < 0 ? Infinity : first) - (second < 0 ? Infinity : second) || a.localeCompare(b);
    });

  const pages = files.map((file) => {
    const slug = path.parse(file).name;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`Invalid page filename: ${file}. Use lowercase letters, numbers and hyphens.`);
    }
    const title = metadata[slug]?.title ?? slug.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
    return {
      source: `content/${file}`,
      slug,
      route: slug === "home" ? "/" : `/${slug}/`,
      title,
      nav: metadata[slug]?.nav ?? title,
      description: metadata[slug]?.description ?? "",
    };
  });

  return { config, pages };
}
