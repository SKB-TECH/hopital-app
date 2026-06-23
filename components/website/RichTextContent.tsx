const allowedTags = new Set([
    "a",
    "b",
    "blockquote",
    "br",
    "div",
    "em",
    "h2",
    "h3",
    "h4",
    "i",
    "li",
    "ol",
    "p",
    "span",
    "strong",
    "u",
    "ul",
]);

const blockedTags =
    "script|style|iframe|object|embed|form|input|button|svg|math|meta|link|base|video|audio|canvas|noscript";

function escapeAttribute(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function sanitizeHref(value: string) {
    const href = value.trim();
    const lowerHref = href.toLowerCase();
    const isAllowed =
        lowerHref.startsWith("http://") ||
        lowerHref.startsWith("https://") ||
        lowerHref.startsWith("mailto:") ||
        lowerHref.startsWith("tel:") ||
        lowerHref.startsWith("/") ||
        lowerHref.startsWith("#");

    return isAllowed ? href : "#";
}

export function sanitizeRichText(html?: string | null) {
    if (!html) {
        return "";
    }

    return html
        .replace(/\u0000/g, "")
        .replace(new RegExp(`<\\s*(${blockedTags})[^>]*>[\\s\\S]*?<\\s*\\/\\s*\\1\\s*>`, "gi"), "")
        .replace(new RegExp(`<\\s*(${blockedTags})[^>]*\\/?>`, "gi"), "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<([^>]+)>/g, (match, rawTag: string) => {
            const tagMatch = rawTag.match(/^\/?\s*([a-z0-9]+)/i);

            if (!tagMatch) {
                return "";
            }

            const tag = tagMatch[1].toLowerCase();
            const isClosingTag = rawTag.trim().startsWith("/");

            if (!allowedTags.has(tag)) {
                return "";
            }

            if (isClosingTag) {
                return tag === "br" ? "" : `</${tag}>`;
            }

            if (tag === "a") {
                const hrefMatch = match.match(/\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
                const href = sanitizeHref(hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? "#");

                return `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">`;
            }

            return `<${tag}>`;
        })
        .trim();
}

type Props = {
    html?: string | null;
    fallback?: string;
};

export default function RichTextContent({ html, fallback = "No description available." }: Props) {
    const content = sanitizeRichText(html);

    if (!content) {
        return <p className="max-w-3xl leading-8 text-gray-600">{fallback}</p>;
    }

    return (
        <div
            className="max-w-3xl leading-8 text-gray-600 [&_a]:font-bold [&_a]:text-[#0067A8] [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-[#0067A8] [&_blockquote]:bg-white/70 [&_blockquote]:py-3 [&_blockquote]:pl-5 [&_blockquote]:italic [&_b]:font-bold [&_em]:italic [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#131827] [&_h3]:mb-3 [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#131827] [&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-[#131827] [&_i]:italic [&_li]:mb-2 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_strong]:font-bold [&_u]:underline [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
