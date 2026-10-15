const normalizeListItem = (item) =>
  typeof item === "string"
    ? { content: item, meta: {}, items: [] }
    : {
        content: item.content || "",
        meta: item.meta || {},
        items: (item.items || []).map(normalizeListItem),
      };

const serializeListItem = (item) => {
  if (!item.items?.length && !Object.keys(item.meta || {}).length) {
    return item.content;
  }

  return {
    content: item.content || "",
    meta: item.meta || {},
    items: (item.items || []).map(serializeListItem),
  };
};

export const normalizeBlogContent = (content) => ({
  ...(content || {}),
  blocks: (content?.blocks || []).map((block) => {
    if (block.type !== "list" || !block.data?.type) return block;
    return {
      ...block,
      data: {
        style: block.data.type,
        meta: block.data.meta || {},
        items: (block.data.items || []).map(normalizeListItem),
      },
    };
  }),
});

export const serializeBlogContent = (content) => ({
  ...content,
  blocks: (content?.blocks || []).map((block) => {
    if (block.type !== "list" || !block.data?.style) return block;
    return {
      ...block,
      data: {
        type: block.data.style,
        items: (block.data.items || []).map(serializeListItem),
      },
    };
  }),
});
