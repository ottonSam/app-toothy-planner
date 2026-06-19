import { Text, View } from 'react-native';

type MarkdownReportProps = {
  markdown: string;
};

type MarkdownBlock =
  | { content: string; type: 'blockquote' | 'heading' | 'paragraph'; level?: number }
  | { items: string[]; ordered: boolean; type: 'list' }
  | { type: 'divider' };

export function MarkdownReport({ markdown }: MarkdownReportProps) {
  const blocks = parseMarkdownBlocks(markdown);

  return (
    <View className="gap-3">
      {blocks.map((block, index) => (
        <MarkdownBlockRenderer block={block} key={index} />
      ))}
    </View>
  );
}

function MarkdownBlockRenderer({ block }: { block: MarkdownBlock }) {
  if (block.type === 'divider') {
    return <View className="h-px bg-border" />;
  }

  if (block.type === 'heading') {
    const headingClass =
      block.level === 1
        ? 'text-xl font-semibold leading-7 text-foreground'
        : block.level === 2
          ? 'text-lg font-semibold leading-6 text-foreground'
          : 'text-base font-semibold leading-6 text-foreground';

    return <Text className={headingClass}>{renderInlineMarkdown(block.content)}</Text>;
  }

  if (block.type === 'blockquote') {
    return (
      <View className="border-l-4 border-primary pl-3">
        <Text className="text-sm leading-6 text-muted-foreground">
          {renderInlineMarkdown(block.content)}
        </Text>
      </View>
    );
  }

  if (block.type === 'list') {
    return (
      <View className="gap-2">
        {block.items.map((item, index) => (
          <View className="flex-row gap-2" key={`${item}-${index}`}>
            <Text className="min-w-5 text-sm leading-6 text-muted-foreground">
              {block.ordered ? `${index + 1}.` : '•'}
            </Text>
            <Text className="flex-1 text-sm leading-6 text-foreground">
              {renderInlineMarkdown(item)}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <Text className="text-sm leading-6 text-foreground">{renderInlineMarkdown(block.content)}</Text>
  );
}

function parseMarkdownBlocks(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let isOrderedList = false;

  const flushParagraph = () => {
    if (!paragraph.length) {
      return;
    }

    blocks.push({ content: paragraph.join(' '), type: 'paragraph' });
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) {
      return;
    }

    blocks.push({ items: listItems, ordered: isOrderedList, type: 'list' });
    listItems = [];
    isOrderedList = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'divider' });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        content: headingMatch[2],
        level: headingMatch[1].length,
        type: 'heading',
      });
      continue;
    }

    const unorderedListMatch = trimmed.match(/^[-*]\s+(.+)$/);
    const orderedListMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (unorderedListMatch || orderedListMatch) {
      flushParagraph();
      const nextIsOrdered = Boolean(orderedListMatch);

      if (listItems.length && isOrderedList !== nextIsOrdered) {
        flushList();
      }

      isOrderedList = nextIsOrdered;
      listItems.push((orderedListMatch ?? unorderedListMatch)?.[1] ?? '');
      continue;
    }

    if (trimmed.startsWith('>')) {
      flushParagraph();
      flushList();
      blocks.push({ content: trimmed.replace(/^>\s?/, ''), type: 'blockquote' });
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function renderInlineMarkdown(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text className="font-semibold text-foreground" key={`${part}-${index}`}>
          {part.slice(2, -2)}
        </Text>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <Text
          className="rounded bg-muted px-1 font-semibold text-foreground"
          key={`${part}-${index}`}>
          {part.slice(1, -1)}
        </Text>
      );
    }

    return part;
  });
}
