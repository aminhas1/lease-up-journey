import { Fragment, type ReactNode } from "react";

// A small Markdown renderer for the docs in /docs. It covers what those files
// use (headings, paragraphs, bullet and numbered lists, bold, links) and
// nothing else, so the app takes no Markdown dependency.

function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = key;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<b key={i++}>{m[1]}</b>);
    } else if (m[2] !== undefined && m[3] !== undefined) {
      out.push(
        <a
          key={i++}
          href={m[3]}
          className="underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          {m[2]}
        </a>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block = { kind: "h1" | "h2" | "p"; text: string } | { kind: "ul" | "ol"; items: string[] };

function parse(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "p", text: para.join(" ") });
    para = [];
  };
  for (const raw of src.split("\n")) {
    const line = raw.trimEnd();
    const last = blocks[blocks.length - 1];
    if (line.startsWith("# ")) {
      flush();
      blocks.push({ kind: "h1", text: line.slice(2) });
    } else if (line.startsWith("## ")) {
      flush();
      blocks.push({ kind: "h2", text: line.slice(3) });
    } else if (line.startsWith("- ")) {
      flush();
      if (last?.kind === "ul") last.items.push(line.slice(2));
      else blocks.push({ kind: "ul", items: [line.slice(2)] });
    } else if (/^\d+\. /.test(line)) {
      flush();
      const text = line.replace(/^\d+\. /, "");
      if (last?.kind === "ol") last.items.push(text);
      else blocks.push({ kind: "ol", items: [text] });
    } else if (line.trim() === "") {
      flush();
    } else {
      para.push(line.trim());
    }
  }
  flush();
  return blocks;
}

export function Markdown({ source, skipTitle = false }: { source: string; skipTitle?: boolean }) {
  const blocks = parse(source);
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "h1":
            return skipTitle ? null : (
              <h1 key={i} className="text-3xl font-bold leading-tight md:text-4xl">
                {inline(b.text)}
              </h1>
            );
          case "h2":
            return (
              <h2
                key={i}
                className="mt-7 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {inline(b.text)}
              </h2>
            );
          case "p":
            return (
              <p key={i} className="mt-2 leading-relaxed">
                {inline(b.text)}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed">
                {b.items.map((t, j) => (
                  <li key={j}>{inline(t)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="mt-2 list-decimal space-y-1.5 pl-5 leading-relaxed">
                {b.items.map((t, j) => (
                  <li key={j}>{inline(t)}</li>
                ))}
              </ol>
            );
          default:
            return <Fragment key={i} />;
        }
      })}
    </>
  );
}
