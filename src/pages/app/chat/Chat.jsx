import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { useSelector, useDispatch } from "react-redux";
import { toggleMobileChatSidebar, infoToggle } from "./store";
import useWidth from "@/hooks/useWidth";
import Icon from "@/components/ui/Icon";
import image1 from "@/assets/images/users/user-1.jpg";

const chatAction = [
  {
    label: "Remove",
    link: "#",
  },
  {
    label: "Forward",
    link: "#",
  },
];

const formatMessageTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes} ${ampm}`;
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const inlineDataToBlob = (value) => {
  if (!value) return null;
  if (value instanceof Blob) return value;
  if (typeof value === "string") {
    if (value.startsWith("data:")) {
      const [, meta, base64] = value.match(/^(.+),(.*)$/) || [];
      if (!base64) return null;
      const mimeMatch = meta.match(/^data:(.*?)(;base64)?$/);
      const mimeType = mimeMatch && mimeMatch[1] ? mimeMatch[1] : "image/png";
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        array[i] = binary.charCodeAt(i);
      }
      return new Blob([array], { type: mimeType });
    }
  }
  return null;
};

const extractFileName = (item) => {
  const candidates = [
    item?.fileName,
    item?.mediaFileName,
    item?.data?.fileName,
    item?.data?.mediaFileName,
    item?.data?.media?.fileName,
    item?.data?.media?.file,
    item?.messageProducts?.[0]?.mediaHeaderLink,
    item?.mediaHeaderLink,
    item?.data,
  ];
  const toUrlPath = (value) => {
    if (!value) return null;
    if (value.startsWith("http")) {
      try {
        const parsed = new URL(value);
        return parsed.pathname.replace(/^\//, "");
      } catch {
        return value;
      }
    }
    return value;
  };
  for (const candidate of candidates) {
    const sanitized = toUrlPath(candidate);
    if (sanitized) return sanitized;
  }
  return null;
};

const getTextContent = (item) => {
  const normalized = [
    item?.text,
    item?.data?.text,
    item?.data?.caption,
    item?.messageReferral?.messageText,
    item?.interactiveData?.message,
    item?.translateText,
    item?.translationText,
  ];
  return normalized.find((value) => typeof value === "string" && value.trim());
};

const getReplySnippet = (item) => {
  if (!item?.replySourceMessage) return null;
  return (
    getTextContent(item.replySourceMessage) ||
    item.replySourceMessage?.text ||
    item.replySourceMessage?.messageText ||
    null
  );
};

const getStatusBadge = (status) => {
  if (!status) return null;
  const normalized = status.toUpperCase();
  const colorClass =
    normalized === "DELIVERED" ? "text-[#1AC8C6]" : "text-slate-400";
  return (
    <span
      className={`flex items-center gap-1 uppercase tracking-[0.3em] ${colorClass}`}
    >
      <Icon icon="heroicons-outline:check" />
      {normalized}
    </span>
  );
};

const Chat = () => {
  const { activechat, openinfo, mobileChatSidebar, user } = useSelector(
    (state) => state.chat
  );
  const { width, breakpoints } = useWidth();
  const dispatch = useDispatch();
  const chatheight = useRef(null);
  const textAreaRef = useRef(null);
  const busyFetch = useRef(false);
  const scrollState = useRef({
    shouldScrollBottom: true,
    adjustForPrepend: false,
    prevHeight: 0,
    prevScrollTop: 0,
  });
  const [messages, setMessages] = useState([]);
  const [mediaMap, setMediaMap] = useState({});
  const mediaCache = useRef({});
  const mediaLoading = useRef(new Set());
  const inlineProcessed = useRef(new Set());
  const [modalImage, setModalImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const endpoint = import.meta.env.VITE_WATI_ENDPOINT;
  const token = import.meta.env.VITE_WATI_TOKEN;

  const normalizeMessages = useCallback((items = []) => {
    return items
      .map((item) => {
        const timestamp =
          item.created ||
          (item.timestamp
            ? new Date(Number(item.timestamp) * 1000).toISOString()
            : new Date().toISOString());
        const fileName = extractFileName(item);
        const dataValue = item?.data;
        const isInlineData =
          item?.type === "image" &&
          dataValue &&
          (dataValue instanceof Blob ||
            (typeof dataValue === "string" && dataValue.startsWith("data:")));
        const messageId = item.id || uuidv4();
        const inlineMediaKey = isInlineData ? `inline-${messageId}` : null;
        const mediaFileName =
          !isInlineData &&
          typeof dataValue === "string" &&
          !dataValue.startsWith("data:")
            ? dataValue
            : fileName;
        const eventDescription =
          item.eventDescription ||
          item?.data?.eventDescription ||
          item?.detailedEventDescription?.description ||
          item?.messageReferral?.eventDescription;
        const statusString =
          item.statusString ||
          item?.data?.statusString ||
          item?.messageProducts?.[0]?.statusString;
        const operatorName =
          item.operatorName ||
          item?.data?.operatorName ||
          item?.detailedEventDescription?.agentName;
        const finalText =
          item.finalText ||
          item?.data?.finalText ||
          item?.eventDescription ||
          null;
        return {
          id: messageId,
          sender: item.owner ? "me" : "them",
          content: getTextContent(item) || "",
          created: timestamp,
          mediaFileName,
          inlineMediaSource: isInlineData ? dataValue : null,
          inlineMediaKey,
          eventType: item.eventType,
          eventDescription,
          statusString,
          operatorName,
          finalText,
          eventActor: item.actor || item?.detailedEventDescription?.agentName,
        };
      })
      .sort((a, b) => new Date(a.created) - new Date(b.created));
  }, []);

  const fetchMessagesPage = useCallback(
    async (pageNumber, { prepend } = {}) => {
      if (!activechat || !user?.phoneNumber || !endpoint || !token) return;
      if (busyFetch.current) return;
      busyFetch.current = true;
      setError("");
      if (prepend) {
        setIsLoadingMore(true);
      } else {
        setIsInitialLoading(true);
        setHasNextPage(false);
      }
      try {
        const response = await fetch(
          `${endpoint}/api/v1/getMessages/${user.phoneNumber}?pageSize=10&pageNumber=${pageNumber}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Gagal mengambil pesan.");
        }
        const body = await response.json();
        const normalized = normalizeMessages(body?.messages?.items ?? []);
        setHasNextPage(Boolean(body?.link?.nextPage));
        setCurrentPage(pageNumber);
        if (prepend) {
          if (chatheight.current) {
            scrollState.current.prevHeight = chatheight.current.scrollHeight;
            scrollState.current.prevScrollTop = chatheight.current.scrollTop;
            scrollState.current.adjustForPrepend = true;
            scrollState.current.shouldScrollBottom = false;
          }
          setMessages((prev) => [...normalized, ...prev]);
        } else {
          scrollState.current.shouldScrollBottom = true;
          setMessages(normalized);
        }
      } catch (err) {
        console.error(err);
        setError("Gagal memuat pesan. Silakan coba ulang.");
      } finally {
        busyFetch.current = false;
        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activechat, user?.phoneNumber, endpoint, token, normalizeMessages]
  );

  const fetchMedia = useCallback(
    async (fileName) => {
      if (
        !fileName ||
        mediaCache.current[fileName] ||
        mediaLoading.current.has(fileName) ||
        !endpoint ||
        !token
      )
        return;
      mediaLoading.current.add(fileName);
      try {
        const mediaResponse = await fetch(
          `${endpoint}/api/v1/getMedia?fileName=${encodeURIComponent(
            fileName
          )}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );
        if (!mediaResponse.ok) {
          throw new Error("Gagal memuat media.");
        }
        const blob = await mediaResponse.blob();
        const url = await blobToDataUrl(blob);
        mediaCache.current[fileName] = url;
        setMediaMap((prev) => ({ ...prev, [fileName]: url }));
      } catch (err) {
        console.error(err);
      } finally {
        mediaLoading.current.delete(fileName);
      }
    },
    [endpoint, token]
  );

  useEffect(() => {
    if (!activechat || !user?.phoneNumber) {
      inlineProcessed.current.clear();
      mediaCache.current = {};
      mediaLoading.current.clear();
      setMediaMap({});
      setMessages([]);
      setCurrentPage(1);
      setHasNextPage(false);
      return;
    }
    scrollState.current = {
      shouldScrollBottom: true,
      adjustForPrepend: false,
      prevHeight: 0,
      prevScrollTop: 0,
    };
    setHasNextPage(false);
    setCurrentPage(1);
    inlineProcessed.current.clear();
    mediaCache.current = {};
    mediaLoading.current.clear();
    setMediaMap({});
    fetchMessagesPage(1);
  }, [activechat, user?.phoneNumber, fetchMessagesPage]);

  useEffect(() => {
    if (!messages.length) return;
    messages.forEach((item) => {
      if (item.mediaFileName) {
        fetchMedia(item.mediaFileName);
      }
    });
  }, [messages, fetchMedia]);

  useEffect(() => {
    if (!messages.length) return;
    messages.forEach((item) => {
      if (
        item.inlineMediaSource &&
        item.inlineMediaKey &&
        !inlineProcessed.current.has(item.inlineMediaKey)
      ) {
        const blob = inlineDataToBlob(item.inlineMediaSource);
        if (!blob) return;
        inlineProcessed.current.add(item.inlineMediaKey);
        (async () => {
          try {
            const url = await blobToDataUrl(blob);
            setMediaMap((prev) => ({ ...prev, [item.inlineMediaKey]: url }));
          } catch (err) {
            console.error(err);
          }
        })();
      }
    });
  }, [messages]);

  useEffect(() => {
    const container = chatheight.current;
    if (!container) return;
    const listener = () => {
      if (
        container.scrollTop <= 80 &&
        hasNextPage &&
        !busyFetch.current &&
        !isLoadingMore
      ) {
        fetchMessagesPage(currentPage + 1, { prepend: true });
      }
    };
    container.addEventListener("scroll", listener);
    return () => container.removeEventListener("scroll", listener);
  }, [fetchMessagesPage, hasNextPage, currentPage, isLoadingMore]);

  useLayoutEffect(() => {
    const container = chatheight.current;
    if (!container) return;
    if (scrollState.current.adjustForPrepend) {
      const heightDiff =
        container.scrollHeight - scrollState.current.prevHeight;
      container.scrollTop = heightDiff + scrollState.current.prevScrollTop;
      scrollState.current.adjustForPrepend = false;
      return;
    }
    if (scrollState.current.shouldScrollBottom) {
      container.scrollTop = container.scrollHeight;
      scrollState.current.shouldScrollBottom = false;
    }
  }, [messages]);

  const handleSendMessage = (value) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    const outgoingMessage = {
      id: uuidv4(),
      sender: "me",
      content: trimmed,
      created: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, outgoingMessage]);
    scrollState.current.shouldScrollBottom = true;
    if (textAreaRef.current) {
      textAreaRef.current.value = "";
    }
  };

  const contactAvatar = user?.avatar || image1;
  const statusClass =
    user?.status === "active" ? "bg-success-500" : "bg-secondary-500";
  const latestStatusMeta = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].statusString || messages[i].operatorName) {
        return messages[i];
      }
    }
    return null;
  }, [messages]);
  const headerStatus = latestStatusMeta?.statusString || "Active now";
  const headerOperator = latestStatusMeta?.operatorName || user?.operatorName;

  return (
    <div className="h-full">
      <header className="border-b border-slate-100 dark:border-slate-700">
        <div className="flex py-6 md:px-6 px-3 items-center">
          <div className="flex-1">
            <div className="flex space-x-3 rtl:space-x-reverse">
              {width <= breakpoints.lg && (
                <span
                  onClick={() => dispatch(toggleMobileChatSidebar(true))}
                  className="text-slate-900 dark:text-white cursor-pointer text-xl self-center ltr:mr-3 rtl:ml-3"
                >
                  <Icon icon="heroicons-outline:menu-alt-1" />
                </span>
              )}
              <div className="flex-none">
                <div className="h-10 w-10 rounded-full relative">
                  <span
                    className={` status ring-1 ring-white inline-block h-[10px] w-[10px] rounded-full absolute -right-0 top-0 ${statusClass}`}
                  ></span>
                  <img
                    src={contactAvatar}
                    alt=""
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              <div className="flex-1 text-start">
                <span className="block text-slate-800 dark:text-slate-300 text-sm font-medium mb-[2px] truncate">
                  {user?.fullName || user?.phoneNumber || "Kontak Maestro"}
                </span>
                <span className="block text-slate-500 dark:text-slate-300 text-xs font-normal">
                  {headerStatus}
                </span>
                {headerOperator && (
                  <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                    Operator: {headerOperator}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex-none flex md:space-x-3 space-x-1 items-center rtl:space-x-reverse">
            <div className="msg-action-btn">
              <Icon icon="heroicons-outline:phone" />
            </div>
            <div className="msg-action-btn">
              <Icon icon="heroicons-outline:video-camera" />
            </div>

            <div
              onClick={() => dispatch(infoToggle(!openinfo))}
              className="msg-action-btn"
            >
              <Icon icon="heroicons-outline:dots-horizontal" />
            </div>
          </div>
        </div>
      </header>
      <div className="chat-content parent-height">
        <div
          className="msgs overflow-y-auto msg-height pt-6 space-y-6"
          ref={chatheight}
        >
          {isLoadingMore && (
            <div className="text-center text-[11px] text-slate-500 dark:text-slate-400">
              Memuat pesan sebelumnya...
            </div>
          )}
          {error && (
            <div className="text-center text-[11px] text-rose-500 dark:text-rose-400">
              {error}
            </div>
          )}
          {isInitialLoading && (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              Memuat pesan...
            </div>
          )}
          {!isInitialLoading && !messages.length && (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              Belum ada riwayat percakapan.
            </div>
          )}
          {messages.map((item) => {
            const inlineKey = item.inlineMediaKey;
            const mediaKey = inlineKey || item.mediaFileName;
            const mediaUrl = mediaKey ? mediaMap[mediaKey] : null;
            const isMediaLoading = Boolean(mediaKey) && !mediaUrl;
            const hasText = Boolean(item.content?.trim());
            const replySnippet = getReplySnippet(item);
            const hasReplySnippet = Boolean(replySnippet);
            const bubbleStatus = item.statusString;
            const bubbleOperatorName = item.operatorName;
            const isEventEntry = Boolean(
              item.eventType && item.eventType !== "message"
            );
            if (isEventEntry) {
              const desc = item.eventDescription || "Event update";
              const actor = item.eventActor;
              const finalText = item.finalText;
              const isBroadcast = item.eventType === "broadcastMessage";
              if (isBroadcast) {
                return (
                  <div
                    className="flex flex-col items-end mb-3 space-y-1"
                    key={`${item.id}-event`}
                  >
                    <div className="bg-[#dff7e4] px-5 py-4 rounded-[18px] shadow-sm text-sm text-slate-900 max-w-[460px] whitespace-pre-wrap break-words">
                      {finalText && (
                        <p className="text-sm leading-relaxed">{finalText}</p>
                      )}
                      <p className="mt-3 text-[11px] text-slate-500 italic">
                        Dikirim oleh {actor || "Maestro Connect"}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {formatMessageTime(item.created)}
                    </span>
                  </div>
                );
              }
              return (
                <div
                  className="flex justify-center my-4"
                  key={`${item.id}-event`}
                >
                  <div className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-5 py-3 rounded-[18px] shadow-sm max-w-[480px] text-left space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 uppercase tracking-[0.3em]">
                      <span>{item.eventType}</span>
                      <span>{formatMessageTime(item.created)}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {desc}
                      {actor && (
                        <span className="block text-[11px] text-slate-400">
                          by {actor}
                        </span>
                      )}
                    </p>
                    {finalText && (
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {finalText}
                      </p>
                    )}
                  </div>
                </div>
              );
            }
            return (
              <div className="block md:px-6 px-4" key={item.id}>
                {item.sender === "them" && (
                  <div className="flex flex-col items-start mb-3 space-y-1">
                    <div className="bg-white px-4 py-3 rounded-[18px] shadow-sm text-sm max-w-[460px] whitespace-pre-wrap break-words">
                      {hasReplySnippet && (
                        <div className="mb-3 flex overflow-hidden rounded border border-slate-200 bg-slate-100">
                          <span className="bg-[#3075f5] w-1"></span>
                          <div className="px-3 py-2 text-[13px] text-slate-600">
                            {replySnippet}
                          </div>
                        </div>
                      )}
                      {hasText && <span>{item.content}</span>}
                      {mediaUrl && (
                        <button
                          type="button"
                          onClick={() => setModalImage(mediaUrl)}
                          className="mt-3 inline-block max-w-[220px]"
                        >
                          <img
                            src={mediaUrl}
                            alt="media"
                            className="w-full rounded border border-slate-200"
                          />
                        </button>
                      )}
                      {isMediaLoading && (
                        <span className="mt-2 block text-[11px] text-slate-400">
                          Memuat gambar...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-[11px] text-slate-500 gap-2">
                      <span>{formatMessageTime(item.created)}</span>
                      {bubbleStatus && getStatusBadge(bubbleStatus)}
                    </div>
                  </div>
                )}
                {item.sender === "me" && (
                  <div className="flex flex-col items-end mb-3 space-y-1">
                    <div className="bg-[#dcf8c6] px-5 py-3 rounded-[18px] text-sm text-slate-900 max-w-[460px] whitespace-pre-wrap break-words">
                      {hasReplySnippet && (
                        <div className="mb-3 flex overflow-hidden rounded border border-slate-200 bg-slate-100">
                          <span className="bg-[#3075f5] w-1"></span>
                          <div className="px-3 py-2 text-[13px] text-slate-600">
                            {replySnippet}
                          </div>
                        </div>
                      )}
                      {hasText && <span>{item.content}</span>}
                      {mediaUrl && (
                        <button
                          type="button"
                          onClick={() => setModalImage(mediaUrl)}
                          className="mt-3 inline-block max-w-[220px]"
                        >
                          <img
                            src={mediaUrl}
                            alt="media"
                            className="w-full rounded border border-slate-200"
                          />
                        </button>
                      )}
                      {isMediaLoading && (
                        <span className="mt-2 block text-[11px] text-slate-600">
                          Memuat gambar...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{formatMessageTime(item.created)}</span>
                      {bubbleStatus && getStatusBadge(bubbleStatus)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {modalImage && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalImage(null)}
          style={{ backdropFilter: "grayscale(1)" }}
        >
          <button
            type="button"
            className="absolute right-6 top-6 text-white text-2xl"
            aria-label="Close image preview"
            onClick={(event) => {
              event.stopPropagation();
              setModalImage(null);
            }}
          >
            ×
          </button>
          <div
            className="max-h-full max-w-full rounded-lg bg-white p-2"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={modalImage}
              alt="media preview"
              className="max-h-[80vh] max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}
      <footer className="md:px-6 px-4 sm:flex md:space-x-4 sm:space-x-2 rtl:space-x-reverse border-t md:pt-6 pt-4 border-slate-100 dark:border-slate-700">
        <div className="flex-none sm:flex hidden md:space-x-3 space-x-1 rtl:space-x-reverse">
          <div className="h-8 w-8 cursor-pointer bg-slate-100 dark:bg-slate-900 dark:text-slate-400 flex flex-col justify-center items-center text-xl rounded-full">
            <Icon icon="heroicons-outline:link" />
          </div>
          <div className="h-8 w-8 cursor-pointer bg-slate-100 dark:bg-slate-900 dark:text-slate-400 flex flex-col justify-center items-center text-xl rounded-full">
            <Icon icon="heroicons-outline:emoji-happy" />
          </div>
        </div>
        <div className="flex-1 relative flex space-x-3 rtl:space-x-reverse">
          <div className="flex-1">
            <textarea
              ref={textAreaRef}
              type="text"
              placeholder="Type your message..."
              className="focus:ring-0 focus:outline-0 block w-full bg-transparent dark:text-white resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(textAreaRef.current?.value);
                }
              }}
            />
          </div>
          <div className="flex-none md:pr-0 pr-3">
            <button
              type="button"
              onClick={() => handleSendMessage(textAreaRef.current?.value)}
              className="h-8 w-8 bg-slate-900 text-white flex flex-col justify-center items-center text-lg rounded-full"
            >
              <Icon
                icon="heroicons-outline:paper-airplane"
                className="transform rotate-[60deg]"
              />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Chat;
