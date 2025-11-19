import React, { useEffect, useRef } from "react";
import SimpleBar from "simplebar-react";
import useWidth from "@/hooks/useWidth";
import { useSelector, useDispatch } from "react-redux";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import MyProfile from "./MyProfile";
import Contacts from "./Contacts";
import Chat from "./Chat";
import Blank from "./Blank";
import Info from "./Info";

import {
  toggleMobileChatSidebar,
  setContactSearch,
  setContacts,
} from "./store";
import { toast } from "react-toastify";
import defaultAvatar from "@/assets/images/users/user-1.jpg";
const ChatPage = () => {
  const { width, breakpoints } = useWidth();
  const dispatch = useDispatch();
  const { activechat, openinfo, mobileChatSidebar, contacts, searchContact } =
    useSelector((state) => state.chat);

  const fileInputRef = useRef(null);
  const searchContacts = contacts?.filter(
    (item) =>
      item.fullName?.toLowerCase().includes(searchContact.toLowerCase()) ||
      item.phoneNumber?.toLowerCase().includes(searchContact.toLowerCase())
  );
  const displayContacts = searchContact ? searchContacts : contacts;

  const parseContactsFromCsv = (content) => {
    const rows = content
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter(Boolean);
    if (rows.length <= 1) return [];
    const headers = rows[0]
      .split(",")
      .map((header) => header.replace(/"/g, "").trim().toLowerCase());
    const phoneIndex = headers.findIndex((header) => header === "phonenumber");
    const statusIndex = headers.findIndex((header) => header === "status");
    if (phoneIndex === -1 || statusIndex === -1) return [];
    const broadcastIndex = headers.findIndex(
      (header) => header === "broadcastname"
    );
    const templateIndex = headers.findIndex(
      (header) => header === "templatename"
    );
    const uniqueNumbers = new Set();
    const parsedContacts = [];
    rows.slice(1).forEach((row) => {
      const values = row.split(",").map((value) => value.trim());
      const rawStatus = values[statusIndex] || "";
      if (rawStatus.toUpperCase() !== "REPLIED") return;
      const phoneValue = values[phoneIndex] || "";
      const digits = phoneValue.replace(/\D/g, "");
      if (!digits || digits.length <= 3) return;
      if (uniqueNumbers.has(digits)) return;
      uniqueNumbers.add(digits);
      const nameValue =
        values[broadcastIndex] || values[templateIndex] || digits;
      const previewValue =
        values[templateIndex] || values[broadcastIndex] || rawStatus;
      parsedContacts.push({
        id: digits,
        phoneNumber: digits,
        fullName: nameValue,
        avatar: defaultAvatar,
        status: "active",
        statusTag: rawStatus,
        lastmessage: previewValue,
        unredmessage: 0,
      });
    });
    return parsedContacts;
  };

  const handleUpload = (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const contactsFromCsv = parseContactsFromCsv(loadEvent.target.result);
      if (!contactsFromCsv.length) {
        toast.warning(
          "File CSV tidak memiliki kontak REPLIED atau nomor yang valid."
        );
        return;
      }
      dispatch(setContacts(contactsFromCsv));
      toast.success(`${contactsFromCsv.length} kontak berhasil ditambahkan.`);
    };
    reader.onerror = () => {
      toast.error("Gagal membaca file. Silakan coba ulang.");
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <div className="flex lg:space-x-5 chat-height overflow-hidden relative rtl:space-x-reverse">
      <div
        className={`transition-all duration-150 flex-none min-w-[260px] 
        ${
          width < breakpoints.lg
            ? "absolute h-full top-0 md:w-[260px] w-[200px] z-[999]"
            : "flex-none min-w-[260px]"
        }
        ${
          width < breakpoints.lg && mobileChatSidebar
            ? "left-0 "
            : "-left-full "
        }
        `}
      >
        <Card
          bodyClass=" relative p-0 h-full overflow-hidden "
          className="h-full"
        >
          <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
            <MyProfile />
          </div>
          <div className="border-b border-slate-100 dark:border-slate-700 py-1">
            <div className="search px-3 mx-6 rounded flex items-center space-x-3 rtl:space-x-reverse">
              <div className="flex-none text-base text-slate-900 dark:text-slate-400">
                <Icon icon="bytesize:search" />
              </div>
              <input
                onChange={(e) => dispatch(setContactSearch(e.target.value))}
                placeholder="Search..."
                className="w-full flex-1 block bg-transparent placeholder:font-normal placeholder:text-slate-400 py-2 focus:ring-0 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-400"
              />
            </div>
            <div className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs uppercase tracking-widest font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded"
                >
                  Upload CSV
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  hanya REPLIED & nomor lengkap
                </span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {contacts?.length ?? 0} kontak siap pakai
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
          <SimpleBar className="contact-height">
            {displayContacts?.map((contact, i) => (
              <Contacts key={contact.id ?? i} contact={contact} />
            ))}
          </SimpleBar>
        </Card>
      </div>

      {/* overlay */}
      {width < breakpoints.lg && mobileChatSidebar && (
        <div
          className="overlay bg-slate-900 dark:bg-slate-900 dark:bg-opacity-60 bg-opacity-60 backdrop-filter
         backdrop-blur-sm absolute w-full flex-1 inset-0 z-[99] rounded-md"
          onClick={() => dispatch(toggleMobileChatSidebar(!mobileChatSidebar))}
        ></div>
      )}

      {/* mai  chat box*/}
      <div className="flex-1 flex flex-col">
        {/* <div className="flex justify-end px-5 py-2 border-b border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs uppercase tracking-widest font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded"
          >
            Upload CSV
          </button>
        </div> */}
        <div className="parent flex space-x-5 h-full rtl:space-x-reverse">
          {/* main message body*/}
          <div className="flex-1">
            <Card bodyClass="p-0 h-full" className="h-full">
              {activechat ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-700 h-full">
                  <Chat />
                </div>
              ) : (
                <Blank />
              )}
            </Card>
          </div>
          {/* right side information*/}
          {width > breakpoints.lg && openinfo && activechat && (
            <div className="flex-none w-[285px]">
              <Card bodyClass="p-0 h-full" className="h-full">
                <Info />
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
