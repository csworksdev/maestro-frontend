import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";

const Modal = ({
  activeModal,
  onClose,
  noFade,
  disableBackdrop,
  className = "max-w-xl",
  children,
  footerContent,
  centered,
  scrollContent,
  themeClass = "bg-slate-900 dark:bg-slate-800 dark:border-b dark:border-slate-700",
  title = "Basic Modal",
  uncontrol,
  label = "Basic Modal",
  labelClass,
  icon,
  iconPosition = "left",
  iconClass = "text-[20px]",
  lazy = false,
  backdropClassName = "bg-slate-900/50",
}) => {
  const [showModal, setShowModal] = useState(false);
  const isOpen = Boolean(uncontrol ? activeModal || showModal : activeModal);
  const [shouldRenderBody, setShouldRenderBody] = useState(!lazy);

  useEffect(() => {
    if (!lazy) {
      setShouldRenderBody(true);
      return;
    }
    if (isOpen) {
      setShouldRenderBody(true);
    }
  }, [isOpen, lazy]);

  const closeModal = () => {
    setShowModal(false);
  };

  const openModal = () => {
    setShowModal((prev) => !prev);
  };
  const returnNull = () => {
    return null;
  };

  const handleAfterLeave = () => {
    if (lazy) {
      setShouldRenderBody(false);
    }
  };

  const shouldRenderContent = !lazy || isOpen || shouldRenderBody;
  const resolvedChildren = shouldRenderContent
    ? typeof children === "function"
      ? children()
      : children
    : null;
  const resolvedFooter = shouldRenderContent ? footerContent : null;
  const backdropClasses = `fixed inset-0 ${backdropClassName}`;

  return (
    <>
      {uncontrol ? (
        <>
          <button
            type="button"
            onClick={openModal}
            className={`btn ${labelClass} inline-flex justify-center`}
            icon={icon}
          >
            {icon && (
              <span
                className={`
          ${iconPosition === "right" ? "order-1 ltr:ml-2 rtl:mr-2" : " "}
          ${title && iconPosition === "left" ? "ltr:mr-2 rtl:ml-2" : ""}
          
          ${iconClass}
          
          `}
              >
                <Icon icon={icon} />
              </span>
            )}
            {label}
          </button>
          <Transition
            appear
            show={isOpen}
            as={Fragment}
            afterLeave={handleAfterLeave}
          >
            <Dialog
              as="div"
              className="relative z-[99999]"
              onClose={!disableBackdrop ? closeModal : returnNull}
            >
              {!disableBackdrop && (
                <Transition.Child
                  as={Fragment}
                  enter={noFade ? "" : "duration-300 ease-out"}
                  enterFrom={noFade ? "" : "opacity-0"}
                  enterTo={noFade ? "" : "opacity-100"}
                  leave={noFade ? "" : "duration-200 ease-in"}
                  leaveFrom={noFade ? "" : "opacity-100"}
                  leaveTo={noFade ? "" : "opacity-0"}
                >
                  <div className={backdropClasses} />
                </Transition.Child>
              )}

              <div className="fixed inset-0 overflow-y-auto">
                <div
                  className={`flex min-h-full justify-center text-center p-6 ${
                    centered ? "items-center" : "items-start "
                  }`}
                >
                  <Transition.Child
                    as={Fragment}
                    enter={noFade ? "" : "duration-300  ease-out"}
                    enterFrom={noFade ? "" : "opacity-0 scale-95"}
                    enterTo={noFade ? "" : "opacity-100 scale-100"}
                    leave={noFade ? "" : "duration-200 ease-in"}
                    leaveFrom={noFade ? "" : "opacity-100 scale-100"}
                    leaveTo={noFade ? "" : "opacity-0 scale-95"}
                  >
                    <Dialog.Panel
                      className={`w-full transform overflow-hidden rounded-md
                 bg-white dark:bg-slate-800 text-left align-middle shadow-xl transition-alll ${className}`}
                    >
                      <div
                        className={`relative overflow-hidden py-4 px-5 text-white flex justify-between  ${themeClass}`}
                      >
                        <h2 className="capitalize leading-6 tracking-wider font-medium text-base text-white">
                          {title}
                        </h2>
                        <button onClick={closeModal} className="text-[22px]">
                          <Icon icon="heroicons-outline:x" />
                        </button>
                      </div>
                      <div
                        className={`px-6 py-8 ${
                          scrollContent ? "overflow-y-auto max-h-[400px]" : ""
                        }`}
                      >
                        {resolvedChildren}
                      </div>
                      {resolvedFooter && (
                        <div className="px-4 py-3 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-700">
                          {resolvedFooter}
                        </div>
                      )}
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </>
      ) : (
        <Transition appear show={isOpen} as={Fragment} afterLeave={handleAfterLeave}>
          <Dialog as="div" className="relative z-[99999]" onClose={onClose}>
            <Transition.Child
              as={Fragment}
              enter={noFade ? "" : "duration-300 ease-out"}
              enterFrom={noFade ? "" : "opacity-0"}
              enterTo={noFade ? "" : "opacity-100"}
              leave={noFade ? "" : "duration-200 ease-in"}
              leaveFrom={noFade ? "" : "opacity-100"}
              leaveTo={noFade ? "" : "opacity-0"}
            >
              {!disableBackdrop && (
                <div className={backdropClasses} />
              )}
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div
                className={`flex min-h-full justify-center text-center p-6 ${
                  centered ? "items-center" : "items-start "
                }`}
              >
                <Transition.Child
                  as={Fragment}
                  enter={noFade ? "" : "duration-300  ease-out"}
                  enterFrom={noFade ? "" : "opacity-0 scale-95"}
                  enterTo={noFade ? "" : "opacity-100 scale-100"}
                  leave={noFade ? "" : "duration-200 ease-in"}
                  leaveFrom={noFade ? "" : "opacity-100 scale-100"}
                  leaveTo={noFade ? "" : "opacity-0 scale-95"}
                >
                  <Dialog.Panel
                    className={`w-full transform overflow-hidden rounded-md
                 bg-white dark:bg-slate-800 text-left align-middle shadow-xl transition-alll ${className}`}
                  >
                    <div
                      className={`relative overflow-hidden py-4 px-5 text-white flex justify-between  ${themeClass}`}
                    >
                      <h2 className="capitalize leading-6 tracking-wider font-medium text-base text-white">
                        {title}
                      </h2>
                      <button onClick={onClose} className="text-[22px]">
                        <Icon icon="heroicons-outline:x" />
                      </button>
                    </div>
                    <div
                      className={`px-6 py-8 ${
                        scrollContent ? "overflow-y-auto max-h-[400px]" : ""
                      }`}
                    >
                      {resolvedChildren}
                    </div>
                    {resolvedFooter && (
                      <div className="px-4 py-3 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-700">
                        {resolvedFooter}
                      </div>
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
    </>
  );
};

export default Modal;
