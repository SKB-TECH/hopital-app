"use client";

import { useEffect, useRef } from "react";
import {
  Bold,
  Eraser,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Underline,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
};

export default function RichTextEditor({ value, onChange, minHeight = "min-h-40" }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== value) editor.innerHTML = value || "";
  }, [value]);

  const run = (command: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    onChange(editorRef.current?.innerHTML ?? "");
  };

  const addLink = () => {
    const url = window.prompt("URL");
    if (url) run("createLink", url);
  };

  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
        <ToolButton label="Bold" onClick={() => run("bold")}><Bold className="size-4" /></ToolButton>
        <ToolButton label="Italic" onClick={() => run("italic")}><Italic className="size-4" /></ToolButton>
        <ToolButton label="Underline" onClick={() => run("underline")}><Underline className="size-4" /></ToolButton>
        <Divider />
        <ToolButton label="Heading 2" onClick={() => run("formatBlock", "h2")}><Heading2 className="size-4" /></ToolButton>
        <ToolButton label="Heading 3" onClick={() => run("formatBlock", "h3")}><Heading3 className="size-4" /></ToolButton>
        <ToolButton label="Quote" onClick={() => run("formatBlock", "blockquote")}><Quote className="size-4" /></ToolButton>
        <Divider />
        <ToolButton label="Bulleted list" onClick={() => run("insertUnorderedList")}><List className="size-4" /></ToolButton>
        <ToolButton label="Numbered list" onClick={() => run("insertOrderedList")}><ListOrdered className="size-4" /></ToolButton>
        <ToolButton label="Link" onClick={addLink}><Link2 className="size-4" /></ToolButton>
        <ToolButton label="Clear formatting" onClick={() => run("removeFormat")}><Eraser className="size-4" /></ToolButton>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className={`${minHeight} w-full overflow-y-auto px-4 py-3 text-sm leading-6 text-slate-800 outline-none [&_a]:text-blue-600 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5`}
      />
    </div>
  );
}

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded border border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-slate-200" />;
}
