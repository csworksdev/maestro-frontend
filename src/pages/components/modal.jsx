import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";

const LOREM_TEXT =
  "Oat cake ice cream candy chocolate cake chocolate cake cotton candy dragée apple pie. Brownie carrot cake candy canes bonbon fruitcake topping halvah. Cake sweet roll cake cheesecake cookie chocolate cake liquorice.";
const LONG_CONTENT_REPEAT = 10;

const BasicContent = () => (
  <>
    <h4 className="font-medium text-lg mb-3 text-slate-900">
      Lorem ipsum dolor sit.
    </h4>
    <div className="text-base text-slate-600 dark:text-slate-300">
      {LOREM_TEXT}
    </div>
  </>
);

const LongContent = () => (
  <>
    <h4 className="font-medium text-lg mb-3 text-slate-900">
      Lorem ipsum dolor sit.
    </h4>
    <div className="text-base text-slate-600 dark:text-slate-300">
      {Array.from({ length: LONG_CONTENT_REPEAT }).map((_, index) => (
        <React.Fragment key={index}>
          {LOREM_TEXT}
          {index < LONG_CONTENT_REPEAT - 1 && (
            <>
              <br />
              <br />
            </>
          )}
        </React.Fragment>
      ))}
    </div>
  </>
);

const LoginFormContent = () => (
  <div className="text-base text-slate-600 dark:text-slate-300">
    <Textinput label="Email" type="email" placeholder="Type your email" />
    <Textinput
      label="Password"
      type="password"
      placeholder="8+ characters, 1 capitat letter "
    />
  </div>
);

const makeDarkModal = (overrides) => ({
  labelClass: "btn-outline-dark",
  footerClassName: "btn-dark",
  content: BasicContent,
  ...overrides,
});

const BASIC_MODALS = [
  makeDarkModal({
    key: "basic",
    title: "Basic Modal",
    label: "Basic Modal",
  }),
  makeDarkModal({
    key: "centered",
    title: "Vertically center",
    label: "Vertically center",
    centered: true,
  }),
  makeDarkModal({
    key: "disabled-backdrop",
    title: "Disabled backdrop",
    label: "Disabled backdrop",
    disableBackdrop: true,
  }),
  makeDarkModal({
    key: "disabled-animation",
    title: "Disabled animation",
    label: "Disabled animation",
    noFade: true,
  }),
];

const THEME_MODALS = [
  {
    key: "primary",
    title: "Primary",
    label: "Primary",
    labelClass: "btn-outline-primary",
    themeClass: "bg-primary-500",
    footerClassName: "btn-primary",
    content: BasicContent,
  },
  {
    key: "secondary",
    title: "Secondary",
    label: "Secondary",
    labelClass: "btn-outline-secondary",
    themeClass: "bg-secondary-500",
    footerClassName: "btn-secondary",
    content: BasicContent,
  },
  {
    key: "success",
    title: "Success",
    label: "Success",
    labelClass: "btn-outline-success",
    themeClass: "bg-success-500",
    footerClassName: "btn-success",
    content: BasicContent,
  },
  {
    key: "info",
    title: "info",
    label: "info",
    labelClass: "btn-outline-info",
    themeClass: "bg-info-500",
    footerClassName: "btn-info",
    content: BasicContent,
  },
  {
    key: "warning",
    title: "Warning",
    label: "Warning",
    labelClass: "btn-outline-warning",
    themeClass: "bg-warning-500",
    footerClassName: "btn-warning",
    content: BasicContent,
  },
  {
    key: "light",
    title: "Light",
    label: "Light",
    labelClass: "btn-outline-light",
    themeClass: "bg-slate-600 text-slate-900",
    footerClassName: "bg-slate-600 text-white",
    content: BasicContent,
  },
];

const SIZE_MODALS = [
  makeDarkModal({
    key: "xs",
    title: "Extra small",
    label: "Extra small",
    className: "max-w-xs",
  }),
  makeDarkModal({
    key: "sm",
    title: "Small modal",
    label: "Small modal",
    className: "max-w-md",
  }),
  makeDarkModal({
    key: "default",
    title: "Default modal",
    label: "Default modal",
    className: "max-w-xs",
  }),
  makeDarkModal({
    key: "lg",
    title: "Large modal",
    label: "Large modal",
    className: "max-w-5xl",
  }),
  makeDarkModal({
    key: "xl",
    title: "Extra large modal",
    label: "Extra large modal",
    className: "max-w-fit",
  }),
];

const FORM_MODALS = [
  makeDarkModal({
    key: "login",
    title: "Login Form Modal",
    label: "Login Form",
    content: LoginFormContent,
  }),
  makeDarkModal({
    key: "long-content",
    title: "Scrolling Long Content Modal",
    label: "Scrolling Long Content",
    content: LongContent,
  }),
  makeDarkModal({
    key: "scrollable-content",
    title: "Scrollable Content Modal",
    label: "Scrollable Content",
    scrollContent: true,
    content: LongContent,
  }),
];

const ModalPage = () => {
  const [activeModal, setActiveModal] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  const openModal = (config) => {
    setModalConfig(config);
    setActiveModal(true);
  };

  const closeModal = () => {
    setActiveModal(false);
  };

  const footerContent = modalConfig?.footerClassName ? (
    <Button
      text="Accept"
      className={modalConfig.footerClassName}
      onClick={() => {
        alert("use Control Modal");
      }}
    />
  ) : null;

  return (
    <>
      <div className="grid xl:grid-cols-2 grid-cols-1 gap-5">
        <Card title="Basic Modal">
          <div className=" space-xy-5">
            {BASIC_MODALS.map((config) => (
              <button
                key={config.key}
                type="button"
                onClick={() => openModal(config)}
                className={`btn ${config.labelClass} inline-flex justify-center`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </Card>
        <Card title="Themes Modal">
          <div className=" space-xy-5">
            {THEME_MODALS.map((config) => (
              <button
                key={config.key}
                type="button"
                onClick={() => openModal(config)}
                className={`btn ${config.labelClass} inline-flex justify-center`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </Card>
        <Card title="Size Modal">
          <div className=" space-xy-5">
            {SIZE_MODALS.map((config) => (
              <button
                key={config.key}
                type="button"
                onClick={() => openModal(config)}
                className={`btn ${config.labelClass} inline-flex justify-center`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </Card>
        <Card title="Form & Scrolling Modals">
          <div className=" space-xy-5">
            {FORM_MODALS.map((config) => (
              <button
                key={config.key}
                type="button"
                onClick={() => openModal(config)}
                className={`btn ${config.labelClass} inline-flex justify-center`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </Card>
      </div>
      <Modal
        activeModal={activeModal}
        onClose={closeModal}
        title={modalConfig?.title}
        className={modalConfig?.className}
        centered={modalConfig?.centered}
        disableBackdrop={modalConfig?.disableBackdrop}
        noFade={modalConfig?.noFade}
        scrollContent={modalConfig?.scrollContent}
        themeClass={modalConfig?.themeClass}
        footerContent={footerContent}
        lazy
      >
        {modalConfig?.content}
      </Modal>
    </>
  );
};

export default ModalPage;
